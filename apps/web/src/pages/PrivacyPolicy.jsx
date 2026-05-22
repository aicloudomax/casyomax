import React from 'react';
import { ShieldCheck, Lock, Mail, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    const currentDate = new Date().toLocaleDateString();

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 bg-white shadow-sm rounded-xl my-8">
            {/* Header */}
            <div className="mb-8 border-b pb-6">
                <Link to="/" className="inline-flex items-center text-primary hover:text-blue-700 mb-6 transition-colors">
                    <ChevronLeft size={20} /> Back to Home
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-gray-500">Effective Date: {currentDate}</p>
            </div>

            <div className="prose prose-blue max-w-none text-gray-700 space-y-8">
                <section>
                    <p className="text-lg leading-relaxed">
                        <strong>Casyomax</strong> (“we” or “our”) is a health management app that helps patients track medications and communicate with caregivers. This Privacy Policy explains what information we collect, why we collect it, and how we use and share it. By using Casyomax, you consent to the collection and use of information as described here.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-primary" size={24} /> Information We Collect
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
                            <p>We collect profile and account details such as name, email address, and role (Patient, Caretaker, or Admin).</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Health Information</h3>
                            <p>We collect medication schedules, adherence logs (Taken, Snoozed, Missed with timestamps), patient health notes (diseases, conditions, and medication-related notes), and other health-related information entered by the patient or caretaker.</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Chat and Voice Data</h3>
                            <p>We collect text conversations with the AI Health Assistant. Voice interactions are processed using speech-to-text and text-to-speech services. Audio is processed only to provide the service and is not stored permanently unless required for functionality.</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Device and Usage Information</h3>
                            <p>We may collect device details, operating system information, IP address, and push notification tokens to ensure proper functioning of the application.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>To provide medication reminders and adherence tracking</li>
                        <li>To enable AI-powered text and voice assistance</li>
                        <li>To allow caretakers to manage and monitor patient care</li>
                        <li>To send notifications and service-related emails</li>
                        <li>To maintain security, troubleshoot issues, and improve app performance</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
                    <p className="mb-4">We do not sell or rent personal or health data. Data is shared only:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>With assigned caretakers authorized by the patient</li>
                        <li>With trusted service providers strictly for app functionality</li>
                        <li>When required by law or legal process</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
                    <p className="mb-4">Casyomax uses the following services:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Microsoft Azure:</strong> OpenAI, Speech Services, Communication Services, cloud hosting</li>
                        <li><strong>Expo:</strong> App build services and push notifications</li>
                    </ul>
                    <p className="mt-4">These providers process data only on our instructions and follow industry-standard security practices.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="text-primary" size={24} /> Data Security & Retention
                    </h2>
                    <p className="mb-4">
                        <strong>Data Retention:</strong> User data is stored securely in the cloud and retained as long as the account is active or as required for operational and legal purposes. Data is deleted upon account removal, subject to applicable laws.
                    </p>
                    <p>
                        <strong>Data Security:</strong> We use encryption, access controls, and secure cloud infrastructure to protect user data. While no system is completely secure, we follow best practices to safeguard information.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">User Rights</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Patients can view and update their own data</li>
                        <li>Caretakers can access only assigned patient data</li>
                        <li>Users may request correction or deletion of their information</li>
                        <li>Users can revoke caretaker access at any time</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Children’s Privacy & Age Restriction</h2>
                    <p className="mb-4">
                        Casyomax is intended for use by adults aged 18 and older, primarily for elderly patients and their caregivers.
                    </p>
                    <p className="mb-4">
                        We do not knowingly collect, use, or disclose personal data from children under the age of 18. If you are under 18, you are not permitted to use this application or provide any personal information.
                    </p>
                    <p>
                        Casyomax is currently available only in the United States. Data is stored and processed within the U.S.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. Changes will be posted in the app or on our website with an updated effective date.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Deletion of User Account</h2>
                    <p className="mb-4">
                        You have the right to request the deletion of your account and all associated data at any time.
                    </p>
                    <p className="mb-4">
                        <strong>In-App Deletion:</strong> You can delete your account directly through the mobile app. Navigate to <strong>Profile &gt; Delete Account</strong>. For security purposes, you will be required to verify your password before the deletion is processed. This action is irreversible.
                    </p>
                    <p>
                        Alternatively, you may contact us via email at: <a href="mailto:google@cloudomax.com" className="text-primary font-bold hover:underline">google@cloudomax.com</a>. We will process your request and permanently delete your data in accordance with applicable laws.
                    </p>
                </section>

                <section className="bg-blue-50 p-6 rounded-lg mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="text-primary" size={24} /> Contact Us
                    </h2>
                    <p className="mb-2">If you have questions about this Privacy Policy or your data, please contact us at:</p>
                    <a href="mailto:google@cloudomax.com" className="text-primary font-bold hover:underline text-lg">
                        google@cloudomax.com
                    </a>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
