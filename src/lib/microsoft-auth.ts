import { ConfidentialClientApplication } from '@azure/msal-node';
import { MicrosoftUserInfo } from '@/types';

const clientConfig = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: process.env.MICROSOFT_AUTHORITY || 'https://login.microsoftonline.com/common',
    },
};

export const msalInstance = new ConfidentialClientApplication(clientConfig);

export const getMicrosoftUserInfo = async (accessToken: string): Promise<MicrosoftUserInfo | null> => {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch user info from Microsoft Graph:', response.statusText);
            return null;
        }

        const userInfo = await response.json();

        return {
            id: userInfo.id,
            displayName: userInfo.displayName,
            mail: userInfo.mail || userInfo.userPrincipalName,
            userPrincipalName: userInfo.userPrincipalName,
            jobTitle: userInfo.jobTitle,
            department: userInfo.department,
            officeLocation: userInfo.officeLocation,
        };
    } catch (error) {
        console.error('Error fetching Microsoft user info:', error);
        return null;
    }
};

export const validateMicrosoftToken = async (accessToken: string): Promise<boolean> => {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const extractRollNumberFromEmail = (email: string): string | null => {
    // Common patterns for college email formats
    // Examples: 
    // - 2021001@college.edu -> 2021001
    // - john.2021001@college.edu -> 2021001
    // - 2021001.john@college.edu -> 2021001

    const patterns = [
        /^(\d{4,10})@/,           // 2021001@college.edu
        /\.(\d{4,10})@/,          // john.2021001@college.edu
        /^(\d{4,10})\./,          // 2021001.john@college.edu
        /_(\d{4,10})@/,           // john_2021001@college.edu
        /(\d{4,10})_/,            // 2021001_john@college.edu
    ];

    for (const pattern of patterns) {
        const match = email.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
};

export const extractSportFromDepartment = (department?: string, jobTitle?: string): string => {
    const sportKeywords = {
        'basketball': 'Basketball',
        'football': 'Football',
        'soccer': 'Soccer',
        'tennis': 'Tennis',
        'volleyball': 'Volleyball',
        'cricket': 'Cricket',
        'badminton': 'Badminton',
        'swimming': 'Swimming',
        'athletics': 'Athletics',
        'track': 'Athletics',
        'field': 'Athletics',
        'hockey': 'Hockey',
        'baseball': 'Baseball',
        'golf': 'Golf',
        'rugby': 'Rugby',
    };

    const textToCheck = `${department || ''} ${jobTitle || ''}`.toLowerCase();

    for (const [keyword, sport] of Object.entries(sportKeywords)) {
        if (textToCheck.includes(keyword)) {
            return sport;
        }
    }

    return 'General'; // Default sport if none detected
};
