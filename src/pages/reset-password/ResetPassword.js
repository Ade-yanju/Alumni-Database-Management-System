// src/pages/reset-password/ResetPassword.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

const schema = Yup.object({
  newPassword: Yup.string()
    .required("Required")
    .min(8, "Min 8 chars")
    .matches(/\d/, "Must contain a number")
    .matches(/[!@#$%^&*]/, "Must contain a symbol"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Required"),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const navigate = useNavigate();
  const auth = getAuth();

  const [verifying, setVerifying] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!oobCode) {
      setSnackbar({
        open: true,
        message: "Reset link is invalid or expired.",
        severity: "error",
      });
      setVerifying(false);
      setCodeValid(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setCodeValid(true);
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Reset link is invalid or expired.",
          severity: "error",
        });
        setCodeValid(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [auth, oobCode]);

  const onSubmit = async ({ newPassword }) => {
    setSubmitLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      navigate("/login", {
        state: { message: "Password changed successfully." },
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ position: "relative", minHeight: "100vh", py: 4 }}
    >
      {/* Logo + Site Name */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.8)",
          px: 2,
          py: 1,
          borderRadius: 1,
          zIndex: 10,
        }}
      >
        <Box
          component="img"
          src="/dulogo.png"
          alt="Dominion University Crest"
          sx={{ width: 40, height: 40, mr: 1 }}
        />
        <Typography variant="h6" color="textPrimary">
          DU-Alumni
        </Typography>
      </Box>

      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom align="center">
              Reset Your Password
            </Typography>

            {verifying ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : codeValid ? (
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit(onSubmit)}
              >
                {/* New Password */}
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Password"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword((v) => !v)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                {/* Confirm Password */}
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Confirm Password"
                      type={showConfirm ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirm((v) => !v)}
                              edge="end"
                            >
                              {showConfirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Box sx={{ mt: 3, position: "relative" }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Save & Sign In"
                    )}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  Reset link is invalid or expired.
                </Alert>
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  variant="outlined"
                >
                  Go to Forgot Password
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
