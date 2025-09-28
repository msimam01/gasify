import { Head, router, useForm } from '@inertiajs/react';
import { RegisterForm } from '@/components/register-form';
import { FormEvent } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/register', {
            onSuccess: () => {
                reset('password', 'password_confirmation');
            },
        });
    };
    
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Register" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <RegisterForm 
                    onSubmit={handleSubmit}
                    errors={errors}
                    processing={processing}
                    canResetPassword
                    data={data}
                    setData={setData}
                />
            </div>
        </div>
    );
}
