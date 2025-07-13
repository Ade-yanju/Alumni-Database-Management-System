// src/admin/alumni/AlumniList.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ArrowBackIos,
} from "@mui/icons-material";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const DEPARTMENTS = [
  "Computer Sciences",
  "Biological Sciences",
  "Chemical Sciences",
  "Management Sciences",
  "Mass Communication",
  "Criminology and Security Studies",
  "Economics",
  "Accounting",
];

export default function AlumniList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    year: "",
    department: "",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, uid: null });

  // reload whenever filters change
  useEffect(() => {
    (async () => {
      setLoading(true);

      // base query
      let q = query(collection(db, "users"), orderBy("fullName"));

      // year filter (2023–2025)
      if (filters.year) {
        q = query(q, where("gradYear", "==", Number(filters.year)));
      }

      // department filter
      if (filters.department) {
        q = query(q, where("department", "==", filters.department));
      }

      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        field: "photoURL",
        headerName: "Photo",
        width: 80,
        sortable: false,
        renderCell: ({ value }) => <Avatar src={value} />,
      },
      { field: "fullName", headerName: "Name", width: 180 },
      { field: "email", headerName: "Email", width: 200 },
      { field: "gradYear", headerName: "Year", width: 100 },
      { field: "department", headerName: "Dept", width: 200 },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <IconButton onClick={() => navigate(`/admin/alumni/${row.id}`)}>
              <ViewIcon />
            </IconButton>
            <IconButton
              onClick={() => navigate(`/admin/alumni/${row.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => setDeleteDialog({ open: true, uid: row.id })}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [navigate]
  );

  const handleDelete = async () => {
    await deleteDoc(doc(db, "users", deleteDialog.uid));
    setDeleteDialog({ open: false, uid: null });
    // retrigger
    setFilters((f) => ({ ...f }));
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Alumni Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {/* Only Year & Department filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={filters.year}
              onChange={(e) =>
                setFilters((f) => ({ ...f, year: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {[2023, 2024, 2025].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={filters.department}
              onChange={(e) =>
                setFilters((f) => ({ ...f, department: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          pageSize={10}
          rowsPerPageOptions={[10, 20]}
          disableSelectionOnClick
        />
      </Container>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, uid: null })}
      >
        <DialogTitle>Confirm Delete?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this alumni record? This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, uid: null })}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
