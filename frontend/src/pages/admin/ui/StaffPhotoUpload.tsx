
import { useEffect, useState, type ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import PersonIcon from "@mui/icons-material/Person";

type StaffPhotoUploadProps = {
  staffId: number;
  staffName: string;
};

type PhotoUploadResponse = {
  photo_url?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "bluepulse_token";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const StaffPhotoUpload = ({
  staffId,
  staffName,
}: StaffPhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  // Создаём предпросмотр фотографии
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Выбор фотографии
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Выберите фотографию JPG, PNG или WebP");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Размер фотографии не должен превышать 5 МБ");
      return;
    }

    setSelectedFile(file);
    setIsUploaded(false);
  };

  // Загрузка фотографии на сервер
  const handleUpload = async () => {
    if (!selectedFile || isUploading || isUploaded) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          "Требуется вход в аккаунт администратора"
        );
      }

      const formData = new FormData();

      // Backend ожидает поле photo
      formData.append("photo", selectedFile);

      let response: Response;

      try {
        response = await fetch(
          `${API_URL}/admin/staff/${staffId}/photo`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
      } catch {
        throw new Error(
          "Не удалось подключиться к серверу"
        );
      }

      if (!response.ok) {
        const errorData: {
          detail?: string | { msg: string }[];
        } = await response.json().catch(() => ({}));

        let message = "Не удалось загрузить фотографию";

        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          message = errorData.detail
            .map((item) => item.msg)
            .join(", ");
        }

        throw new Error(message);
      }

      const result: PhotoUploadResponse =
        await response.json();

      setIsUploaded(true);

      setSuccess(
        result.photo_url
          ? "Фотография успешно сохранена на сервере!"
          : "Фотография успешно загружена!"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ошибка загрузки фотографии"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setError("");
    setSuccess("");
    setIsUploaded(false);
  };

  return (
    <Box
      sx={{
        border: "1px solid #DCE7F3",
        borderRadius: "12px",
        bgcolor: "#F4F8FE",
        p: 2,
        my: 2,
      }}
    >
      <Typography
        sx={{
          color: "#102B52",
          fontSize: 15,
          fontWeight: 700,
          mb: 2,
        }}
      >
        Фотография сотрудника
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Предпросмотр */}
        <Box
          sx={{
            width: 120,
            height: 140,
            borderRadius: "10px",
            bgcolor: "#DCE7F3",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt={`Фотография: ${staffName}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <PersonIcon
              sx={{
                fontSize: 54,
                color: "#6B819E",
              }}
            />
          )}
        </Box>

        {/* Выбор файла */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Button
            component="label"
            variant="outlined"
            disabled={isUploading}
            startIcon={<AddPhotoAlternateOutlinedIcon />}
            sx={{
              color: "#176BFF",
              borderColor: "#176BFF",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Выбрать фотографию

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
          </Button>

          <Typography
            sx={{
              fontSize: 12,
              color: "#6B819E",
              mt: 1,
            }}
          >
            JPG, PNG или WebP. Максимум 5 МБ.
          </Typography>

          {selectedFile && (
            <>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#102B52",
                  mt: 1,
                  overflowWrap: "anywhere",
                }}
              >
                Выбрано: {selectedFile.name}
              </Typography>

              <Button
                type="button"
                size="small"
                disabled={isUploading}
                onClick={handleRemoveSelected}
                sx={{
                  mt: 0.5,
                  px: 0,
                  textTransform: "none",
                }}
              >
                Убрать выбранное фото
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Ошибка */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Успешная загрузка */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {/* Кнопка загрузки */}
      <Button
        type="button"
        variant="contained"
        fullWidth
        disabled={
          !selectedFile || isUploading || isUploaded
        }
        onClick={() => void handleUpload()}
        startIcon={
          isUploading ? (
            <CircularProgress
              size={18}
              color="inherit"
            />
          ) : undefined
        }
        sx={{
          mt: 2,
          minHeight: 44,
          bgcolor: "#176BFF",
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            bgcolor: "#0F57D9",
          },
        }}
      >
        {isUploading
          ? "Загружаем..."
          : isUploaded
            ? "Фотография загружена"
            : "Загрузить фотографию"}
      </Button>
    </Box>
  );
};
