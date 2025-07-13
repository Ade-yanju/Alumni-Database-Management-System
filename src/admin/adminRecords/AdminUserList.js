// src/admin/users/AdminUserList.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  ArrowBackIos,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function AdminUserList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  // fetch admins
  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = query(collection(db, "admins"), orderBy("name"));
      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  const handleDelete = async () => {
    await deleteDoc(doc(db, "admins", deleteId));
    setRows((r) => r.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Name", width: 180 },
      { field: "email", headerName: "Email", width: 220 },
      { field: "role", headerName: "Role", width: 140 },
      { field: "status", headerName: "Status", width: 140 },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setDeleteId(row.id)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [navigate]
  );

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
          <Box
            component="img"
            src="/dulogo.png"
            alt="DU Logo"
            sx={{ width: 32, ml: 1, cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard")}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Admin Users
          </Typography>
          <Button color="inherit" onClick={() => navigate("/admin/users/new")}>
            + Add Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, height: 500 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 20]}
            disableSelectionOnClick
          />
        )}
      </Container>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Admin?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this admin account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
