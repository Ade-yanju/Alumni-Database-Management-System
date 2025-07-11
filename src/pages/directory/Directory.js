// src/pages/directory/DirectoryPage.js
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIcon,
  Phone as PhoneIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function DirectoryPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const me = auth.currentUser?.uid;

  // data & UI state
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [locFilter, setLocFilter] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // load alumni once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(arr);
        setFiltered(arr);
      } catch (e) {
        console.error(e);
        setError("Failed to load alumni.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // derive dropdown options
  const departments = Array.from(
    new Set(users.map((u) => u.department))
  ).sort();
  const years = Array.from(new Set(users.map((u) => u.gradYear))).sort();
  const locations = Array.from(new Set(users.map((u) => u.location))).sort();

  // apply filters
  const applyFilters = () => {
    let res = users;
    if (search) {
      const term = search.toLowerCase();
      res = res.filter((u) => u.fullName?.toLowerCase().includes(term));
    }
    if (deptFilter) res = res.filter((u) => u.department === deptFilter);
    if (yearFilter)
      res = res.filter((u) => String(u.gradYear) === String(yearFilter));
    if (locFilter) res = res.filter((u) => u.location === locFilter);
    setFiltered(res);
  };

  // open profile modal
  const handleOpen = (u) => {
    setSelected(u);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setSelected(null);
  };

  // connect (optional, commented out)
  const handleConnect = async (targetUid) => {
    if (!me) {
      return setSnack({
        open: true,
        message: "Please log in to connect.",
        severity: "error",
      });
    }
    try {
      await setDoc(doc(db, "users", me, "connections", targetUid), {
        connectedAt: serverTimestamp(),
      });
      setSnack({
        open: true,
        message: "Connection request sent!",
        severity: "success",
      });
    } catch (e) {
      console.error(e);
      setSnack({
        open: true,
        message: "Could not connect.",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ display: "flex", py: 4, gap: 4 }}>
      {/* Sidebar / Filters */}
      <Box
        sx={{
          width: 300,
          bgcolor: "background.paper",
          borderRadius: 1,
          p: 2,
          boxShadow: 1,
          flexShrink: 0,
        }}
      >
        {/* DU Logo */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            component="img"
            src="/dulogo.png"
            alt="Dominion University"
            sx={{ width: 120 }}
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>

        <TextField
          label="Search alumni"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          margin="dense"
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Department</InputLabel>
          <Select
            value={deptFilter}
            label="Department"
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Graduation Year</InputLabel>
          <Select
            value={yearFilter}
            label="Graduation Year"
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Current Location</InputLabel>
          <Select
            value={locFilter}
            label="Current Location"
            onChange={(e) => setLocFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {locations.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={applyFilters}
          fullWidth
          sx={{ mt: 2 }}
        >
          Apply Filters
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Header with Back Arrow */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <IconButton onClick={() => navigate("/dashboard")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" ml={1}>
            Alumni Directory
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Graduation Year</TableCell>
              <TableCell>Current Location</TableCell>
              <TableCell align="right">Profile</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.fullName}</TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell>{u.gradYear}</TableCell>
                <TableCell>{u.location}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleOpen(u)}>
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Profile Detail Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        {selected && (
          <>
            <DialogTitle>{selected.fullName}</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Avatar
                  src={selected.photoURL}
                  sx={{ width: 80, height: 80, mx: "auto" }}
                />
              </Box>
              <Typography>
                <strong>Department:</strong> {selected.department}
              </Typography>
              <Typography>
                <strong>Graduation Year:</strong> {selected.gradYear}
              </Typography>
              <Typography>
                <strong>Location:</strong> {selected.location}
              </Typography>
              {selected.email && (
                <Typography>
                  <strong>Email:</strong> {selected.email}
                </Typography>
              )}
              {selected.phoneNumber && (
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <PhoneIcon sx={{ mr: 1 }} />
                  <MuiLink href={`tel:${selected.phoneNumber}`}>
                    {selected.phoneNumber}
                  </MuiLink>
                </Box>
              )}
              {(selected.facebook ||
                selected.linkedin ||
                selected.instagram) && (
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  {selected.facebook && (
                    <MuiLink
                      href={selected.facebook}
                      target="_blank"
                      rel="noopener"
                    >
                      <FacebookIcon />
                    </MuiLink>
                  )}
                  {selected.linkedin && (
                    <MuiLink
                      href={selected.linkedin}
                      target="_blank"
                      rel="noopener"
                    >
                      <LinkedInIcon />
                    </MuiLink>
                  )}
                  {selected.instagram && (
                    <MuiLink
                      href={selected.instagram}
                      target="_blank"
                      rel="noopener"
                    >
                      <InstagramIcon />
                    </MuiLink>
                  )}
                </Box>
              )}
              {selected.about && (
                <Box sx={{ mt: 2 }}>
                  <Typography>
                    <strong>About:</strong>
                  </Typography>
                  <Typography>{selected.about}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Close</Button>
              {/* <Button onClick={() => handleConnect(selected.id)}>Connect</Button> */}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
