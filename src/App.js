// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

// public pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import ResetPassword from "./pages/reset-password/ResetPassword";

// alumni‐only pages
import AlumniDashboard from "./pages/AlumniDashboard/AlumniDashboard";
import NewsList from "./pages/news/NewsList";
import NewsDetail from "./pages/news/NewsDetail";
import EventsPage from "./pages/events/EventsPage";
import EventsDetails from "./pages/events/EventsDetails";
import Directory from "./pages/directory/Directory";
import ForumList from "./pages/forum/ForumList";
import ForumNew from "./pages/forum/ForumNew";
import ForumThread from "./pages/forum/ForumThread";
import ProfileView from "./pages/profile/ProfileView";
import ProfileEdit from "./pages/profile/ProfileEdit";

// admin‐only pages
import AdminDashboard from "./admin/dashboard/AdminDashboard";
import AlumniListAdmin from "./admin/alumni/AlumniList";
import AlumniDetailAdmin from "./admin/alumni/AlumniDetail";
import AlumniApproval from "./admin/alumni/AlumniApproval";
import EventsListAdmin from "./admin/events/EventsList";
import EventFormAdmin from "./admin/events/EventForm";
import NewsListAdmin from "./admin/news/NewsList";
import NewsFormAdmin from "./admin/news/NewsForm";
import ForumModeration from "./admin/forum/ForumModeration";
import NewsDetailAdmin from "./admin/news/NewsDetailAdmin";
import AdminUserListForm from "./admin/adminRecords/AdminUserListForm";
import AdminUserList from "./admin/adminRecords/AdminUserList";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Alumni‐only */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<AlumniDashboard />} />
        <Route path="/news" element={<NewsList />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventsDetails />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/forum" element={<ForumList />} />
        <Route path="/forum/new" element={<ForumNew />} />
        <Route path="/forum/:threadId" element={<ForumThread />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
      </Route>

      {/* Admin‐only */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/alumni" element={<AlumniListAdmin />} />
        <Route path="/admin/alumni/:uid" element={<AlumniDetailAdmin />} />
        <Route path="/admin/alumni/:uid/approve" element={<AlumniApproval />} />
        <Route path="/admin/events" element={<EventsListAdmin />} />
        <Route path="/admin/events/new" element={<EventFormAdmin />} />
        <Route path="/admin/news" element={<NewsListAdmin />} />
        <Route path="/admin/news/new" element={<NewsFormAdmin />} />
        <Route path="/admin/forum" element={<ForumModeration />} />
        <Route path="/admin/news/detail" element={<NewsDetailAdmin />} />
        <Route path="/admin/adminRecords" element={<AdminUserListForm />} />
        <Route path="/admin/adminRecords/list" element={<AdminUserList />} />
      </Route>

      {/* Catch‐all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
