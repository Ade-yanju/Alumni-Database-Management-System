import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/#about" },
  { label: "Events", to: "/events" },
  { label: "News", to: "/news" },
  { label: "Contact", to: "/#contact" },
];

export default function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  const drawer = (
    <Box onClick={() => setOpen(false)} sx={{ width: 240 }}>
      <List>
        {navItems.map((item) => (
          <ListItemButton key={item.label} component={RouterLink} to={item.to}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton component={RouterLink} to="/login">
          <ListItemText primary="Login" />
        </ListItemButton>
        <ListItemButton component={RouterLink} to="/signup">
          <ListItemText primary="Register" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="absolute"
        elevation={0}
        sx={{ background: "transparent", color: "#fff" }}
      >
        <Toolbar>
          {/* Dominion Crest at top-left */}
          <Box
            component="img"
            src="/dulogo.png"
            alt="Dominion University Crest"
            sx={{ width: 48, height: 48, mr: 2 }}
          />

          {/* Site Title */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
          >
            Dominion Alumni
          </Typography>

          {isMobile ? (
            <IconButton color="inherit" onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : (
            <>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  sx={{ ml: 2 }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="secondary"
                sx={{ ml: 4 }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="outlined"
                color="inherit"
                sx={{ ml: 2 }}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        {drawer}
      </Drawer>
    </>
  );
}
