'use client';

import React, { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const msalConfig = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
        authority: process.env.NEXT_PUBLIC_MICROSOFT_AUTHORITY || 'https://login.microsoftonline.com/common',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    },
};

const LoginComponent: React.FC = () => {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showRoleVerification, setShowRoleVerification] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'Coach' | 'Admin'>('Coach');
    const [password, setPassword] = useState('');
    const [tempUserData, setTempUserData] = useState<{ name: string; email: string; microsoftId: string } | null>(null);
    const [error, setError] = useState('');

    const msalInstance = new PublicClientApplication(msalConfig);

    const handleMicrosoftLogin = async () => {
        try {
            setIsLoading(true);
            setError('');

            await msalInstance.initialize();

            const loginRequest = {
                scopes: ['User.Read'],
            };

            const response = await msalInstance.loginPopup(loginRequest);

            if (response.accessToken) {
                // Send token to backend for verification and user creation
                const res = await fetch('/api/auth/ms-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: response.accessToken,
                    }),
                });

                const data = await res.json();

                if (data.success) {
                    if (data.requiresPasswordVerification) {
                        // Show role verification form for Coach/Admin
                        setTempUserData(data.user);
                        setShowRoleVerification(true);
                    } else {
                        // Student login - complete
                        login(data.user, data.token);
                        window.location.href = '/dashboard';
                    }
                } else {
                    setError(data.message || 'Login failed');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Microsoft login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempUserData) return;

        try {
            setIsLoading(true);
            setError('');

            const res = await fetch('/api/auth/role-verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    microsoftId: tempUserData.microsoftId,
                    role: selectedRole,
                    password,
                }),
            });

            const data = await res.json();

            if (data.success) {
                login(data.user, data.token);
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'Role verification failed');
            }
        } catch (error) {
            console.error('Role verification error:', error);
            setError('Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setShowRoleVerification(false);
        setTempUserData(null);
        setPassword('');
        setSelectedRole('Coach');
        setError('');
    };

    if (showRoleVerification) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            Role Verification
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Welcome, {tempUserData?.name}. Please verify your role and enter your password.
                        </p>
                    </div>

                    <Card>
                        <CardContent>
                            <form onSubmit={handleRoleVerification} className="space-y-4">
                                <Select
                                    label="Role"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as 'Coach' | 'Admin')}
                                    options={[
                                        { value: 'Coach', label: 'Coach' },
                                        { value: 'Admin', label: 'Admin' },
                                    ]}
                                    required
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your role password"
                                    required
                                />

                                {error && (
                                    <div className="text-red-600 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        className="flex-1"
                                    >
                                        Verify & Login
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBackToLogin}
                                        disabled={isLoading}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Sports Equipment Manager
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in with your college Microsoft account
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button
                                onClick={handleMicrosoftLogin}
                                isLoading={isLoading}
                                className="w-full flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21">
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                </svg>
                                Sign in with Microsoft
                            </Button>

                            {error && (
                                <div className="text-red-600 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="text-xs text-gray-500 text-center">
                                <p>Students: Automatic login after Microsoft authentication</p>
                                <p>Coaches/Admins: Additional password verification required</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginComponent;
