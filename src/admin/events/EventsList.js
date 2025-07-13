// src/admin/events/EventsList.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ArrowBackIos, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { format } from "date-fns";

export default function EventsList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("upcoming");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = Timestamp.fromDate(new Date());
      let q = query(
        collection(db, "events"),
        where("date", filter === "upcoming" ? ">=" : "<", now),
        orderBy("date", filter === "upcoming" ? "asc" : "desc")
      );
      const snap = await getDocs(q);
      setRows(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            location: data.location,
            date: data.date.toDate(),
            // RSVPs count could be stored on event doc or aggregated client-side
            rsvpCount: data.rsvpCount || 0,
          };
        })
      );
      setLoading(false);
    })();
  }, [filter]);

  const columns = [
    {
      field: "date",
      headerName: "Date",
      width: 180,
      valueFormatter: ({ value }) => format(value, "PPpp"),
    },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    { field: "rsvpCount", headerName: "RSVPs", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Button onClick={() => navigate(`/admin/events/${row.id}`)}>
            View
          </Button>
          <Button onClick={() => navigate(`/admin/events/${row.id}/edit`)}>
            Edit
          </Button>
          <Button
            color="error"
            onClick={() => {
              /* TODO: delete */
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

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
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Event Management
          </Typography>
          <Button
            color="inherit"
            startIcon={<Add />}
            onClick={() => navigate("/admin/events/new")}
          >
            Add Event
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl>
            <InputLabel>Show</InputLabel>
            <Select
              label="Show"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="past">Past</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10, 20]}
            disableSelectionOnClick
          />
        )}
      </Container>
    </Box>
  );
}
