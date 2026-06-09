/**
 * Written by Theo Justman 6/2/26 
 * src/lib/appwrite.js
 * Central Appwrite SDK configuration.
 */
import { Client, Databases, Account } from 'react-native-appwrite';

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setPlatform('com.theodorejustman.tournamentsearch');

//Database
export const databases = new Databases(client);

//Account service
export const account = new Account(client);

//Raw client
export default client;