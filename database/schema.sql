--
-- PostgreSQL database dump
--

\restrict sJtbRCyvISgnXIT2lM2vNDRYQdbmKlo3R0NdhD13VLnfZrRymxyO0ujlLWdKsTD

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: check_booking_consistency(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_booking_consistency() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_capacity SMALLINT;
    v_session_status VARCHAR(12);
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
    v_taken BIGINT;
    v_user_role VARCHAR(16);
    v_price NUMERIC(10,2);
    v_currency VARCHAR(3);
    v_service_active BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'reserved' THEN
            RAISE EXCEPTION 'New booking must start with status reserved';
        END IF;
        -- Never trust a submitted price: copy the current service price.
        SELECT price, currency_code, is_active
          INTO v_price, v_currency, v_service_active
          FROM services WHERE id = NEW.service_id;
        IF NOT COALESCE(v_service_active, FALSE) THEN
            RAISE EXCEPTION 'Cannot book an inactive or unknown service';
        END IF;
        NEW.price_at_booking := v_price;
        NEW.currency_at_booking := v_currency;
    ELSE
        -- The price and references are historical facts. Changing status is allowed;
        -- changing the client/session/price is not.
        IF NEW.client_id IS DISTINCT FROM OLD.client_id OR
           NEW.session_id IS DISTINCT FROM OLD.session_id OR
           NEW.service_id IS DISTINCT FROM OLD.service_id OR
           NEW.price_at_booking IS DISTINCT FROM OLD.price_at_booking OR
           NEW.currency_at_booking IS DISTINCT FROM OLD.currency_at_booking THEN
            RAISE EXCEPTION 'Booking identities and recorded price cannot be changed';
        END IF;
        IF OLD.status IN ('cancelled','attended','no_show')
           AND NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Terminal booking status cannot be changed';
        END IF;
    END IF;

    -- Cancelled bookings do not reserve a place. The CHECK constraint requires
    -- cancelled_at to be filled; setting both fields is the API's responsibility.
    IF NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- Serialize bookings by client and by session (safe for concurrent requests).
    PERFORM 1 FROM users WHERE id = NEW.client_id FOR UPDATE;
    SELECT r.code INTO v_user_role FROM users u
       JOIN roles r ON r.id = u.role_id WHERE u.id = NEW.client_id;
    IF v_user_role IS DISTINCT FROM 'client' THEN
        RAISE EXCEPTION 'Bookings must belong to a client';
    END IF;

    SELECT capacity, status, starts_at, ends_at
      INTO v_capacity, v_session_status, v_start, v_end
      FROM sessions WHERE id = NEW.session_id FOR UPDATE;

    IF TG_OP = 'INSERT' AND
       (v_session_status IS DISTINCT FROM 'open' OR v_start <= NOW()) THEN
        RAISE EXCEPTION 'Only future open sessions can be booked';
    END IF;

    SELECT COUNT(*) INTO v_taken
      FROM bookings b
     WHERE b.session_id = NEW.session_id
       AND b.status <> 'cancelled'
       AND b.id IS DISTINCT FROM NEW.id;
    IF v_taken >= v_capacity THEN
        RAISE EXCEPTION 'Session is full';
    END IF;

    IF EXISTS (
        SELECT 1 FROM bookings b
        JOIN sessions s ON s.id = b.session_id
        WHERE b.client_id = NEW.client_id AND b.status <> 'cancelled'
          AND b.id IS DISTINCT FROM NEW.id AND s.status <> 'cancelled'
          AND tstzrange(s.starts_at, s.ends_at, '[)') &&
              tstzrange(v_start, v_end, '[)')
    ) THEN
        RAISE EXCEPTION 'Client already has an overlapping booking';
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: check_session_consistency(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_session_consistency() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_booking_type VARCHAR(12);
    v_duration SMALLINT;
    v_requires_staff BOOLEAN;
    v_service_active BOOLEAN;
    v_room_capacity SMALLINT;
    v_room_active BOOLEAN;
    v_staff_active BOOLEAN;
    v_taken BIGINT;
BEGIN
    SELECT booking_type, duration_minutes, requires_staff, is_active
      INTO v_booking_type, v_duration, v_requires_staff, v_service_active
      FROM services WHERE id = NEW.service_id;
    SELECT max_capacity, is_active INTO v_room_capacity, v_room_active
      FROM rooms WHERE id = NEW.room_id;

    IF NEW.capacity > v_room_capacity THEN
        RAISE EXCEPTION 'Session capacity % exceeds room maximum %', NEW.capacity, v_room_capacity;
    END IF;
    IF v_booking_type = 'individual' AND NEW.capacity <> 1 THEN
        RAISE EXCEPTION 'Individual service must have capacity = 1';
    END IF;
    IF v_booking_type = 'group' AND NEW.capacity < 2 THEN
        RAISE EXCEPTION 'Group class must have capacity >= 2';
    END IF;
    IF EXTRACT(EPOCH FROM (NEW.ends_at - NEW.starts_at)) <> v_duration * 60 THEN
        RAISE EXCEPTION 'Session duration differs from service duration';
    END IF;
    IF NEW.status = 'open' THEN
        IF NOT v_service_active OR NOT v_room_active THEN
            RAISE EXCEPTION 'Cannot publish session for inactive service or room';
        END IF;
        IF v_requires_staff AND NEW.staff_id IS NULL THEN
            RAISE EXCEPTION 'This service requires a staff member';
        END IF;
        IF NEW.staff_id IS NOT NULL THEN
            SELECT is_active INTO v_staff_active FROM staff WHERE id = NEW.staff_id;
            IF NOT v_staff_active THEN
                RAISE EXCEPTION 'Cannot publish a session with inactive staff';
            END IF;
        END IF;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        SELECT count(*) INTO v_taken FROM bookings
         WHERE session_id = NEW.id AND status <> 'cancelled';
        IF NEW.capacity < v_taken THEN
            RAISE EXCEPTION 'Cannot lower capacity below % existing bookings', v_taken;
        END IF;
        IF v_taken > 0 AND (
           NEW.service_id IS DISTINCT FROM OLD.service_id OR
           NEW.starts_at IS DISTINCT FROM OLD.starts_at OR
           NEW.ends_at IS DISTINCT FROM OLD.ends_at OR
           NEW.room_id IS DISTINCT FROM OLD.room_id OR
           NEW.staff_id IS DISTINCT FROM OLD.staff_id
        ) THEN
            RAISE EXCEPTION 'Cancel and rebook clients before moving a booked session';
        END IF;
        IF v_taken > 0 AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
            RAISE EXCEPTION 'Cancel linked bookings before cancelling a session';
        END IF;
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: protect_room_capacity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_room_capacity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM sessions s WHERE s.room_id = OLD.id
        AND s.status <> 'cancelled' AND s.capacity > NEW.max_capacity
    ) THEN
        RAISE EXCEPTION 'Existing session capacity exceeds new room capacity';
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: protect_service_mode(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_service_mode() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM sessions s
      WHERE s.service_id = OLD.id AND s.status <> 'cancelled')
      AND (NEW.booking_type IS DISTINCT FROM OLD.booking_type OR
           NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes OR
           NEW.requires_staff IS DISTINCT FROM OLD.requires_staff) THEN
        RAISE EXCEPTION 'Cannot change service type/duration/staff requirement with scheduled sessions';
    END IF;
    RETURN NEW;
END; $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    session_id bigint NOT NULL,
    service_id integer NOT NULL,
    price_at_booking numeric(10,2) NOT NULL,
    currency_at_booking character varying(3) NOT NULL,
    status character varying(12) DEFAULT 'reserved'::character varying NOT NULL,
    booked_at timestamp with time zone DEFAULT now() NOT NULL,
    cancelled_at timestamp with time zone,
    CONSTRAINT chk_booking_currency CHECK (((currency_at_booking)::text ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_booking_price CHECK ((price_at_booking >= (0)::numeric)),
    CONSTRAINT chk_booking_status CHECK (((status)::text = ANY ((ARRAY['reserved'::character varying, 'cancelled'::character varying, 'attended'::character varying, 'no_show'::character varying])::text[]))),
    CONSTRAINT chk_cancel_date CHECK (((((status)::text = 'cancelled'::text) AND (cancelled_at IS NOT NULL)) OR (((status)::text <> 'cancelled'::text) AND (cancelled_at IS NULL))))
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.bookings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id smallint NOT NULL,
    code character varying(16) NOT NULL,
    CONSTRAINT chk_role_code CHECK (((code)::text = ANY ((ARRAY['client'::character varying, 'staff'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(80) NOT NULL,
    max_capacity smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_room_capacity CHECK (((max_capacity >= 1) AND (max_capacity <= 1000)))
);


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rooms ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    code character varying(40) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    booking_type character varying(12) NOT NULL,
    duration_minutes smallint NOT NULL,
    requires_staff boolean DEFAULT true NOT NULL,
    price numeric(10,2) NOT NULL,
    currency_code character varying(3) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_service_code CHECK (((code)::text ~ '^[a-z0-9_]+$'::text)),
    CONSTRAINT chk_service_currency CHECK (((currency_code)::text ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_service_duration CHECK (((duration_minutes >= 5) AND (duration_minutes <= 480))),
    CONSTRAINT chk_service_price CHECK ((price >= (0)::numeric)),
    CONSTRAINT chk_service_type CHECK (((booking_type)::text = ANY ((ARRAY['group'::character varying, 'individual'::character varying])::text[])))
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.services ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    service_id integer NOT NULL,
    room_id integer NOT NULL,
    staff_id integer,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    capacity smallint NOT NULL,
    status character varying(12) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_session_capacity CHECK (((capacity >= 1) AND (capacity <= 1000))),
    CONSTRAINT chk_session_dates CHECK ((ends_at > starts_at)),
    CONSTRAINT chk_session_status CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'open'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sessions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    user_id bigint,
    display_name character varying(120) NOT NULL,
    "position" character varying(60) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_staff_display_name CHECK ((length(btrim((display_name)::text)) >= 2))
);


--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.staff ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.staff_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: staff_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_services (
    staff_id integer NOT NULL,
    service_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    role_id smallint NOT NULL,
    full_name character varying(120) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_email CHECK ((POSITION(('@'::text) IN (email)) > 1)),
    CONSTRAINT chk_user_full_name CHECK ((length(btrim((full_name)::text)) >= 2))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: sessions ex_session_room_overlap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT ex_session_room_overlap EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at, '[)'::text) WITH &&) WHERE (((status)::text <> 'cancelled'::text));


--
-- Name: sessions ex_session_staff_overlap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT ex_session_staff_overlap EXCLUDE USING gist (staff_id WITH =, tstzrange(starts_at, ends_at, '[)'::text) WITH &&) WHERE ((((status)::text <> 'cancelled'::text) AND (staff_id IS NOT NULL)));


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_code_key UNIQUE (code);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: services services_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_code_key UNIQUE (code);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_services staff_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_services
    ADD CONSTRAINT staff_services_pkey PRIMARY KEY (staff_id, service_id);


--
-- Name: staff staff_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_key UNIQUE (user_id);


--
-- Name: sessions uq_session_id_service; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT uq_session_id_service UNIQUE (id, service_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_bookings_client_booked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_client_booked ON public.bookings USING btree (client_id, booked_at DESC);


--
-- Name: ix_bookings_session_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_session_active ON public.bookings USING btree (session_id) WHERE ((status)::text <> 'cancelled'::text);


--
-- Name: ix_sessions_open_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sessions_open_start ON public.sessions USING btree (starts_at) WHERE ((status)::text = 'open'::text);


--
-- Name: ix_sessions_service_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sessions_service_start ON public.sessions USING btree (service_id, starts_at);


--
-- Name: ix_sessions_staff_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sessions_staff_start ON public.sessions USING btree (staff_id, starts_at) WHERE (staff_id IS NOT NULL);


--
-- Name: ix_staff_services_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_staff_services_service ON public.staff_services USING btree (service_id);


--
-- Name: ux_bookings_client_session_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_bookings_client_session_active ON public.bookings USING btree (client_id, session_id) WHERE ((status)::text <> 'cancelled'::text);


--
-- Name: ux_users_email_ci; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_users_email_ci ON public.users USING btree (lower((email)::text));


--
-- Name: bookings trg_booking_consistency; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_booking_consistency BEFORE INSERT OR UPDATE OF client_id, session_id, service_id, price_at_booking, currency_at_booking, status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.check_booking_consistency();


--
-- Name: rooms trg_protect_room_capacity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_room_capacity BEFORE UPDATE OF max_capacity ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.protect_room_capacity();


--
-- Name: services trg_protect_service_mode; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_service_mode BEFORE UPDATE OF booking_type, duration_minutes, requires_staff ON public.services FOR EACH ROW EXECUTE FUNCTION public.protect_service_mode();


--
-- Name: sessions trg_session_consistency; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_session_consistency BEFORE INSERT OR UPDATE OF service_id, room_id, staff_id, starts_at, ends_at, capacity, status ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.check_session_consistency();


--
-- Name: bookings bookings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: bookings fk_booking_session_service; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_booking_session_service FOREIGN KEY (session_id, service_id) REFERENCES public.sessions(id, service_id) ON DELETE RESTRICT;


--
-- Name: sessions fk_session_staff_service; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_session_staff_service FOREIGN KEY (staff_id, service_id) REFERENCES public.staff_services(staff_id, service_id) ON DELETE RESTRICT;


--
-- Name: sessions sessions_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT;


--
-- Name: sessions sessions_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- Name: staff_services staff_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_services
    ADD CONSTRAINT staff_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- Name: staff_services staff_services_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_services
    ADD CONSTRAINT staff_services_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE RESTRICT;


--
-- Name: staff staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict sJtbRCyvISgnXIT2lM2vNDRYQdbmKlo3R0NdhD13VLnfZrRymxyO0ujlLWdKsTD

