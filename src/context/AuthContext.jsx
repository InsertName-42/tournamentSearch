/**
 * src/context/AuthContext.jsx
 * Centralized Authentication Context Provider
 * Written by Theo Justman 6/2/26 
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { account } from '../lib/appwrite';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const checkSession = async () => {
        try {
            const currentUser = await account.get();
            setUser(currentUser);
        } catch (error) {
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = async (email, password) => {
        setAuthLoading(true);
        try {
            //Establish session token
            await account.createEmailPasswordSession(email, password);
            //Immediately fetch profile data to alter state
            const currentUser = await account.get();
            setUser(currentUser);
            return currentUser;
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (error) {
            console.error("Logout execution failure:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, authLoading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);