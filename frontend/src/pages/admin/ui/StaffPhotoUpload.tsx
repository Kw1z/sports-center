
import { useEffect, useState, type ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Typography,
} from "@mui/material";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import PersonIcon from "@mui/icons-material/Person";

type StaffPhotoUploadProps = {
  staffName: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const StaffPhotoUpload = ({
  staffName,
}: StaffPhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Выберите фотографию JPG, PNG или WebP");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Размер фотографии не должен превышать 5 МБ");
      return;
    }

    setSelectedFile(file);
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
              alt={`Предпросмотр фотографии: ${staffName}`}
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

        <Box sx={{ flex: 1, width: "100%" }}>
          <Button
            component="label"
            variant="outlined"
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
                onClick={() => setSelectedFile(null)}
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

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {selectedFile && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Фотография выбрана, но пока не загружена на сервер.
        </Alert>
      )}

      <Button
        type="button"
        variant="contained"
        disabled
        fullWidth
        sx={{
          mt: 2,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Загрузить фотографию
      </Button>

      <Typography
        sx={{
          color: "#6B819E",
          fontSize: 12,
          mt: 1,
          textAlign: "center",
        }}
      >
        Загрузка станет доступна после подключения API.
      </Typography>
    </Box>
  );
};
