import { Head, useForm } from '@inertiajs/react';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { FormEvent } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });
    
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/forgot-password', {
            onSuccess: () => {
                // Handle success if needed
            },
        });
    };
    
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('email', e.target.value);
    };
    
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Forgot password" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <ForgotPasswordForm 
                    onSubmit={handleSubmit}
                    errors={errors}
                    processing={processing}
                    status={status}
                    value={data.email}
                    onChange={handleEmailChange}
                />
            </div>
        </div>
    );
}
