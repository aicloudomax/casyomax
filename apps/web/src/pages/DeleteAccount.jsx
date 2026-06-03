import React from 'react';
import { Trash2, Mail, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = 'google@cloudomax.com';

const DeleteAccount = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 bg-white shadow-sm rounded-xl my-8">
            {/* Header */}
            <div className="mb-8 border-b pb-6">
                <Link to="/" className="inline-flex items-center text-primary hover:text-blue-700 mb-6 transition-colors">
                    <ChevronLeft size={20} /> Back to Home
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <Trash2 className="text-primary" size={32} /> Delete Your Account
                </h1>
                <p className="text-gray-500">
                    This page explains how to delete your Casyomax account and what data is removed.
                </p>
            </div>

            <div className="prose prose-blue max-w-none text-gray-700 space-y-8">
                <section>
                    <p className="text-lg leading-relaxed">
                        You can permanently delete your <strong>Casyomax</strong> account and all associated
                        data at any time. Account deletion is permanent and cannot be undone.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Option 1 — Delete in the app</h2>
                    <p className="mb-4">The fastest way to delete your account is directly inside the Casyomax mobile app:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Open the Casyomax app and sign in.</li>
                        <li>Go to the <strong>Profile</strong> tab.</li>
                        <li>Tap <strong>Delete Account</strong>.</li>
                        <li>Confirm by entering your password when prompted (required for your security).</li>
                    </ol>
                    <p className="mt-4">
                        Once confirmed, your account and associated data are permanently removed and you are
                        signed out immediately. This action is irreversible.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Option 2 — Request deletion by email</h2>
                    <p className="mb-4">
                        If you can no longer access the app, you can request account deletion by emailing us
                        from the email address associated with your account:
                    </p>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request`}
                        className="text-primary font-bold hover:underline text-lg"
                    >
                        {SUPPORT_EMAIL}
                    </a>
                    <p className="mt-4">
                        Please include the email address registered with your account. We verify ownership of
                        the account before processing, and we will permanently delete your data within
                        <strong> 30 days</strong> of the verified request, in accordance with applicable laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShieldAlert className="text-primary" size={24} /> What data is deleted
                    </h2>
                    <p className="mb-4">When your account is deleted, we permanently remove:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Your profile and account details (name, email, phone, role, password)</li>
                        <li>Your medications, medication schedules, and reminders</li>
                        <li>Your medication adherence logs (taken / snoozed / missed history)</li>
                        <li>Caregiver–patient connections and assignments linked to your account</li>
                        <li>Your saved contacts</li>
                        <li>Your conversations with the AI Health Assistant</li>
                        <li>Push notification tokens and device records</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Data we may retain</h2>
                    <p>
                        After deletion, we do not keep your personal or health data, except where a limited
                        record must be retained to comply with legal, accounting, or security obligations.
                        Any such records are kept only as long as required by law and are then deleted.
                    </p>
                </section>

                <section className="bg-blue-50 p-6 rounded-lg mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="text-primary" size={24} /> Questions?
                    </h2>
                    <p className="mb-2">If you have any questions about deleting your account or your data, contact us at:</p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-bold hover:underline text-lg">
                        {SUPPORT_EMAIL}
                    </a>
                </section>
            </div>
        </div>
    );
};

export default DeleteAccount;
