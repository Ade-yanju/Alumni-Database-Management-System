// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const auth = getAuth();
  const db = getFirestore();
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setState({ user: null, loading: false });
        return;
      }
      // look for an "admins" doc
      const adminSnap = await getDoc(doc(db, "admins", fbUser.uid));
      const isAdmin = adminSnap.exists();

      // look for an "alumni" doc
      const alumnSnap = await getDoc(doc(db, "users", fbUser.uid));
      const isAlumni = alumnSnap.exists();

      let role = null;
      if (isAdmin) role = "admin";
      else if (isAlumni) role = "alumni";

      setState({
        user: {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          role,
        },
        loading: false,
      });
    });
    return unsub;
  }, [auth, db]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
