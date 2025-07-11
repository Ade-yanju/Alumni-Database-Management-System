// src/pages/dashboard/AlumniDashboard.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  List as MUIList,
  ListItem,
  ListItemText as MUIListItemText,
  Divider,
  Link,
  Menu,
  MenuItem,
} from "@mui/material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Article as ArticleIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const DRAWER_WIDTH = 240;

// --- Styled Search Components ---
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  marginLeft: theme.spacing(2),
}));
const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  position: "absolute",
  display: "flex",
  alignItems: "center",
  pointerEvents: "none",
}));
const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "20ch",
  },
}));

// --- Hook to load profile, stats, events & threads ---
function useDashboardData() {
  const auth = getAuth();
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1) Load auth + profile + stats
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const uid = user.uid;
      setUid(uid);

      try {
        // profile
        const pSnap = await getDoc(doc(db, "users", uid));
        setProfile(pSnap.data() || {});

        // stats
        const now = Timestamp.fromDate(new Date());
        const [eSnap, mSnap] = await Promise.all([
          getCountFromServer(
            query(
              collection(db, "rsvps", uid, "events"),
              where("date", ">=", now)
            )
          ),
          getCountFromServer(
            query(
              collection(db, "messages", uid, "threads"),
              where("unread", "==", true)
            )
          ),
        ]);
        setStats([
          { label: "RSVPed Events", value: eSnap.data().count, to: "/events" },
          { label: "Unread Messages", value: mSnap.data().count, to: "/forum" },
        ]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [auth]);

  // 2) Real-time upcoming events
  useEffect(() => {
    const now = Timestamp.fromDate(new Date());
    const evQuery = query(
      collection(db, "events"),
      where("date", ">=", now),
      orderBy("date", "asc"),
      limit(5)
    );
    return onSnapshot(
      evQuery,
      (snap) => setUpcoming(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setError(e.message)
    );
  }, []);

  // 3) Real-time recent threads
  useEffect(() => {
    if (!uid) return;
    const thQuery = query(
      collection(db, "messages", uid, "threads"),
      orderBy("lastUpdated", "desc"),
      limit(5)
    );
    return onSnapshot(
      thQuery,
      (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setError(e.message)
    );
  }, [uid]);

  return {
    uid,
    profile,
    stats,
    upcoming,
    threads,
    loading,
    error,
    setError,
    clearError: () => setError(""),
  };
}

export default function AlumniDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = getAuth();
  const {
    uid,
    profile,
    stats,
    upcoming,
    threads,
    loading,
    error,
    setError,
    clearError,
  } = useDashboardData();

  // Edit Profile dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [formState, setFormState] = useState({
    fullName: "",
    gradYear: "",
    department: "",
    location: "",
    about: "",
    phoneNumber: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  });
  const [saving, setSaving] = useState(false);

  // Avatar menu
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const fileInputRef = useRef();

  // Sync Firestore profile → formState
  useEffect(() => {
    if (!profile) return;
    setFormState({
      fullName: profile.fullName || "",
      gradYear: profile.gradYear || "",
      department: profile.department || "",
      location: profile.location || "",
      about: profile.about || "",
      phoneNumber: profile.phoneNumber || "",
      facebook: profile.facebook || "",
      linkedin: profile.linkedin || "",
      instagram: profile.instagram || "",
    });
  }, [profile]);

  // Save edited profile
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), formState);
      setOpenEdit(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Cloudinary upload → Firebase Auth & Firestore
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
      );
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
        formData
      );
      const newUrl = res.data.secure_url;
      // update Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: newUrl });
      // update Firestore profile
      await updateDoc(doc(db, "users", uid), { photoURL: newUrl });
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload profile picture.");
    } finally {
      setAnchorEl(null);
    }
  };

  // Logout
  const handleLogout = () => {
    signOut(auth);
    // no navigate on reload — only on logout
    navigate("/login");
  };

  if (loading || !profile) {
    return (
      <Box sx={{ textAlign: "center", pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
        }}
      >
        <Toolbar>
          {/* Logo & Title */}
          <Box
            component={RouterLink}
            to="/dashboard"
            sx={{
              display: "flex",
              alignItems: "center",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <Box
              component="img"
              src="/dulogo.png"
              alt="DU Logo"
              sx={{ width: 32, mr: 1 }}
            />
            <Typography variant="h6">Alumni Dashboard</Typography>
          </Box>

          {/* Search
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
            />
          </Search> */}

          <Box sx={{ flexGrow: 1 }} />

          {/* Edit Profile */}
          <IconButton onClick={() => setOpenEdit(true)} color="inherit">
            <EditIcon />
          </IconButton>

          {/* Avatar & Menu */}
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            color="inherit"
          >
            <Avatar src={profile.photoURL} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                fileInputRef.current.click();
                setAnchorEl(null);
              }}
            >
              Change Profile Picture
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleProfilePicChange}
          />
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
      >
        <Toolbar />
        <Divider />
        <List>
          {[
            { text: "Dashboard", to: "/dashboard", icon: <DashboardIcon /> },
            { text: "Directory", to: "/directory", icon: <PeopleIcon /> },
            { text: "Events", to: "/events", icon: <EventIcon /> },
            { text: "News", to: "/news", icon: <ArticleIcon /> },
            { text: "Forum", to: "/forum", icon: <MessageIcon /> },
          ].map((item) => (
            <ListItemButton key={item.text} component={RouterLink} to={item.to}>
              {item.icon}
              <ListItemText primary={item.text} sx={{ pl: 1 }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg">
          {/* Profile Card */}
          <Card sx={{ mb: 4, p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  src={profile.photoURL}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h5">{profile.fullName}</Typography>
                  <Typography color="text.secondary">
                    Class of {profile.gradYear} | {profile.department}
                  </Typography>
                  <Typography color="text.secondary">
                    {profile.location}
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    {profile.phoneNumber && (
                      <Link href={`tel:${profile.phoneNumber}`}>
                        <PhoneIcon />
                      </Link>
                    )}
                    {profile.facebook && (
                      <Link
                        href={profile.facebook}
                        target="_blank"
                        rel="noopener"
                      >
                        <FacebookIcon />
                      </Link>
                    )}
                    {profile.linkedin && (
                      <Link
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener"
                      >
                        <LinkedInIcon />
                      </Link>
                    )}
                    {profile.instagram && (
                      <Link
                        href={profile.instagram}
                        target="_blank"
                        rel="noopener"
                      >
                        <InstagramIcon />
                      </Link>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography>{profile.about}</Typography>
            </Box>
          </Card>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item>
              <Button
                variant="contained"
                component={RouterLink}
                to="/forum/new"
              >
                New Discussion
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" component={RouterLink} to="/forum">
                View Discussions
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" component={RouterLink} to="/directory">
                Search Alumni
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" component={RouterLink} to="/events">
                Search Events
              </Button>
            </Grid>
          </Grid>

          {/* Stats Grid */}
          <Grid container spacing={2}>
            {stats.map((s) => (
              <Grid item xs={12} sm={6} key={s.label}>
                <Card
                  onClick={() => navigate(s.to)}
                  sx={{ cursor: "pointer", textAlign: "center" }}
                >
                  <CardContent>
                    <Typography variant="h4">{s.value}</Typography>
                    <Typography color="text.secondary">{s.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recent Discussions */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6">Recent Discussions</Typography>
              <MUIList>
                {threads.map((t) => (
                  <ListItem
                    key={t.id}
                    button
                    onClick={() => navigate(`/forum/${t.id}`)}
                  >
                    <MUIListItemText
                      primary={t.title}
                      secondary={new Date(
                        t.lastUpdated?.toDate() || t.createdAt.toDate()
                      ).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </MUIList>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6">Upcoming Events</Typography>
              <MUIList>
                {upcoming.map((e) => (
                  <ListItem
                    key={e.id}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={() => navigate(`/events/${e.id}`)}
                      >
                        Details
                      </Button>
                    }
                  >
                    <MUIListItemText
                      primary={e.title}
                      secondary={new Date(e.date.toDate()).toLocaleDateString()}
                    />
                  </ListItem>
                ))}
              </MUIList>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          {[
            { key: "fullName", label: "Full Name" },
            { key: "gradYear", label: "Graduation Year" },
            { key: "department", label: "Department" },
            { key: "location", label: "Location" },
            { key: "phoneNumber", label: "Phone Number" },
            { key: "facebook", label: "Facebook URL" },
            { key: "linkedin", label: "LinkedIn URL" },
            { key: "instagram", label: "Instagram URL" },
            { key: "about", label: "About" },
          ].map(({ key, label }) => (
            <TextField
              key={key}
              label={label}
              fullWidth
              margin="normal"
              multiline={key === "about"}
              rows={key === "about" ? 4 : 1}
              value={formState[key]}
              onChange={(e) =>
                setFormState((s) => ({ ...s, [key]: e.target.value }))
              }
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={clearError}
      >
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
