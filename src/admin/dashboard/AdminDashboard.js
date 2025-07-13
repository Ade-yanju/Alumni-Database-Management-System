// src/admin/dashboard/AdminDashboard.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  AdminPanelSettings as AdminUsersIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const DRAWER_WIDTH = 240;
const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: DRAWER_WIDTH,
  marginTop: theme.mixins.toolbar.minHeight,
}));

export default function AdminDashboard() {
  const auth = getAuth();
  const [user, setUser] = useState(null);

  // Counts
  const [totalAlumni, setTotalAlumni] = useState(null);
  const [newSignups, setNewSignups] = useState(null);
  const [pendingRsvps, setPendingRsvps] = useState(null);
  const [error, setError] = useState("");

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);

  // Load current user
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
          setNewName(u.displayName || "");
        }
      }),
    [auth]
  );

  // Fetch live counts
  useEffect(() => {
    (async () => {
      try {
        // total alumni
        const totalSnap = await getCountFromServer(collection(db, "users"));
        setTotalAlumni(totalSnap.data().count);

        // new signups last 7 days
        const weekAgo = Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const newSnap = await getCountFromServer(
          query(collection(db, "users"), where("createdAt", ">=", weekAgo))
        );
        setNewSignups(newSnap.data().count);

        // pending RSVPs (assumes events have status field)
        const pSnap = await getCountFromServer(
          query(collection(db, "events"), where("status", "==", "pending"))
        );
        setPendingRsvps(pSnap.data().count);
      } catch (e) {
        console.error(e);
        setError("Failed to load counts.");
      }
    })();
  }, []);

  // Save profile changes
  const handleProfileSave = async () => {
    try {
      let photoURL = user.photoURL;
      if (newPhoto) {
        const form = new FormData();
        form.append("file", newPhoto);
        form.append(
          "upload_preset",
          process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
        );
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
          { method: "POST", body: form }
        );
        const data = await res.json();
        photoURL = data.secure_url;
      }
      await updateProfile(auth.currentUser, { displayName: newName, photoURL });
      setUser({ ...user, displayName: newName, photoURL });
      setProfileOpen(false);
    } catch (e) {
      console.error(e);
      setError("Failed to update profile.");
    }
  };

  const handleLogout = () => signOut(auth);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, to: "/admin/dashboard" },
    { text: "Alumni Management", icon: <PeopleIcon />, to: "/admin/alumni" },
    { text: "Event Management", icon: <EventIcon />, to: "/admin/events" },
    { text: "News & Announcements", icon: <ArticleIcon />, to: "/admin/news" },
    {
      text: "Admin Users",
      icon: <AdminUsersIcon />,
      to: "/admin/adminRecords",
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ ml: DRAWER_WIDTH }}>
        <Toolbar>
          <IconButton edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box
            component={RouterLink}
            to="/admin/dashboard"
            sx={{
              display: "flex",
              alignItems: "center",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            <Box
              component="img"
              src="/dulogo.png"
              alt="DU"
              sx={{ width: 32, mr: 1 }}
            />
            <Typography variant="h6">Admin Dashboard</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar src={user?.photoURL} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setProfileOpen(true);
                setAnchorEl(null);
              }}
            >
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
        open
      >
        <Toolbar />
        <List>
          {menuItems.map((i) => (
            <ListItemButton key={i.text} component={RouterLink} to={i.to}>
              <ListItemIcon>{i.icon}</ListItemIcon>
              <ListItemText primary={i.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Main>
        <Toolbar />
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              {
                label: "Total Alumni",
                value: totalAlumni,
                to: "/admin/alumni",
              },
              {
                label: "New Sign-ups (7d)",
                value: newSignups,
                to: "/admin/alumni?filter=7d",
              },
              {
                label: "Pending RSVPs",
                value: pendingRsvps,
                to: "/admin/events?tab=pending",
              },
            ].map(({ label, value, to }) => (
              <Grid item xs={12} md={4} key={label}>
                <Card sx={{ height: 140 }}>
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="h6">{label}</Typography>
                    {value == null ? (
                      <CircularProgress size={36} />
                    ) : (
                      <Typography variant="h3">{value}</Typography>
                    )}
                    <Button size="small" component={RouterLink} to={to}>
                      View
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Main>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)}>
        <DialogTitle>Edit My Profile</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button variant="outlined" component="label">
            Change Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setNewPhoto(e.target.files[0])}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProfileSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}
