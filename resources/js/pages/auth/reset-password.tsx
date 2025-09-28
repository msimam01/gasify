import { Head, useForm } from '@inertiajs/react';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { FormEvent } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email: initialEmail }: ResetPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: initialEmail,
        password: '',
        password_confirmation: '',
        token,
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/reset-password', {
            onSuccess: () => {
                // Handle success if needed
            },
        });
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('email', e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('password', e.target.value);
    };

    const handlePasswordConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('password_confirmation', e.target.value);
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Reset password" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <ResetPasswordForm 
                    onSubmit={handleSubmit}
                    errors={errors}
                    processing={processing}
                    email={data.email}
                    onEmailChange={handleEmailChange}
                    onPasswordChange={handlePasswordChange}
                    onPasswordConfirmationChange={handlePasswordConfirmationChange}
                />
            </div>
        </div>
    );
}
