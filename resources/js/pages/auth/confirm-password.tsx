import { Head, router, useForm } from '@inertiajs/react';
import { ConfirmPasswordForm } from '@/components/confirm-password-form';
import { FormEvent } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post('/password/confirm', data, {
            onSuccess: () => {
                // The page will be reloaded automatically by Inertia
            },
        });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('password', e.target.value);
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Confirm Password" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <ConfirmPasswordForm 
                    onSubmit={handleSubmit}
                    errors={errors}
                    processing={processing}
                    onPasswordChange={handlePasswordChange}
                    value={data.password}
                />
            </div>
        </div>
    );
}
