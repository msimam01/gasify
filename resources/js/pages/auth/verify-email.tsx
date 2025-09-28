import { Head, router } from '@inertiajs/react';
import { VerifyEmailForm } from '@/components/verify-email-form';
import { FormEvent } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post('/email/verification-notification');
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Email Verification" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <VerifyEmailForm 
                    onSubmit={handleSubmit}
                    status={status}
                    onLogout={handleLogout}
                />
            </div>
        </div>
    );
}
