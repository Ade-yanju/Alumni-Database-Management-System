// src/pages/news/NewsDetail.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Snackbar,
  Link as MuiLink,
} from "@mui/material";
import { useParams, Link as RouterLink } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function NewsDetail() {
  const { id } = useParams();
  const auth = getAuth();

  const [user, setUser] = useState(null);

  // News article
  const [newsItem, setNewsItem] = useState(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState("");

  // Comments
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");

  // Reactions (likes)
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loadingReacts, setLoadingReacts] = useState(true);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // 1) Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, [auth]);

  // 2) Load news doc
  useEffect(() => {
    (async () => {
      setLoadingNews(true);
      try {
        const ref = doc(db, "news", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNewsError("News item not found.");
        } else {
          setNewsItem({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error(e);
        setNewsError("Failed to load news.");
      } finally {
        setLoadingNews(false);
      }
    })();
  }, [id]);

  // 3) Load comments
  useEffect(() => {
    (async () => {
      setLoadingComments(true);
      try {
        const snap = await getDocs(collection(db, "news", id, "comments"));
        setComments(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis())
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [id]);

  // 4) Load reactions
  useEffect(() => {
    (async () => {
      setLoadingReacts(true);
      try {
        const snap = await getDocs(collection(db, "news", id, "reactions"));
        const uids = snap.docs.map((d) => d.id);
        setLikeCount(uids.length);
        setLiked(user ? uids.includes(user.uid) : false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingReacts(false);
      }
    })();
  }, [id, user]);

  // 5) Post a comment
  const handleCommentSubmit = async () => {
    if (!user) {
      setSnack({
        open: true,
        message: "Log in to comment.",
        severity: "warning",
      });
      return;
    }
    try {
      await addDoc(collection(db, "news", id, "comments"), {
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      setSnack({
        open: true,
        message: "Comment posted!",
        severity: "success",
      });
      // reload comments
      const snap = await getDocs(collection(db, "news", id, "comments"));
      setComments(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis())
      );
    } catch {
      setSnack({
        open: true,
        message: "Failed to post comment.",
        severity: "error",
      });
    }
  };

  // 6) Toggle Like
  const handleToggleLike = async () => {
    if (!user) {
      setSnack({
        open: true,
        message: "Log in to react.",
        severity: "warning",
      });
      return;
    }
    const reactRef = doc(db, "news", id, "reactions", user.uid);
    setLoadingReacts(true);
    try {
      if (liked) {
        await deleteDoc(reactRef);
        setLikeCount((c) => c - 1);
        setLiked(false);
      } else {
        await setDoc(reactRef, {
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
        setLikeCount((c) => c + 1);
        setLiked(true);
      }
    } catch {
      setSnack({
        open: true,
        message: "Failed to update reaction.",
        severity: "error",
      });
    } finally {
      setLoadingReacts(false);
    }
  };

  if (loadingNews) {
    return (
      <Box sx={{ textAlign: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (newsError) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{newsError}</Alert>
        <Button component={RouterLink} to="/news" sx={{ mt: 2 }}>
          Back to News
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4, position: "relative" }}>
      {/* Top‐left DU logo → LandingPage */}
      <MuiLink
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src="/dulogo.png"
          alt="DU Logo"
          sx={{ width: 40, mr: 1 }}
        />
        <Typography variant="h6" color="text.primary">
          DU-Alumni
        </Typography>
      </MuiLink>

      {/* Back to list */}
      <Button component={RouterLink} to="/news" sx={{ mt: 2 }}>
        ← Back to News
      </Button>

      {/* Article */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {newsItem.title}
        </Typography>
        <Typography color="text.secondary">
          {newsItem.createdAt?.toDate().toLocaleDateString()}
        </Typography>
        {newsItem.imageURL && (
          <Box
            component="img"
            src={newsItem.imageURL}
            alt=""
            sx={{
              width: "100%",
              mt: 2,
              borderRadius: 1,
              objectFit: "cover",
            }}
          />
        )}
        <Typography sx={{ mt: 2 }}>{newsItem.content}</Typography>
      </Box>

      {/* Reactions */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant={liked ? "contained" : "outlined"}
          onClick={handleToggleLike}
          disabled={loadingReacts}
        >
          {liked ? "Unlike" : "Like"} ({likeCount})
        </Button>
      </Box>

      {/* Comments */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Comments</Typography>
      </Box>

      {loadingComments ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <List>
            {comments.map((c) => (
              <ListItem key={c.id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={c.photoURL} />
                </ListItemAvatar>
                <ListItemText
                  primary={c.name}
                  secondary={
                    <>
                      <Typography variant="body2">{c.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.createdAt?.toDate().toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2 }}>
            <TextField
              label="Add a comment"
              fullWidth
              multiline
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </Box>
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
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
