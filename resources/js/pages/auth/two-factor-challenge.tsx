import { Head, router, useForm } from '@inertiajs/react';
import { TwoFactorChallengeForm } from '@/components/two-factor-challenge-form';
import { useState } from 'react';

export default function TwoFactorChallenge() {
    const [showRecovery, setShowRecovery] = useState(false);
    const [code, setCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const { processing, errors } = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post('/two-factor-challenge', { 
            code
        });
    };

    const handleRecoverySubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post('/two-factor-challenge', { 
            recovery_code: recoveryCode
        });
    };

    const handleToggleMode = () => {
        setShowRecovery(!showRecovery);
        setCode('');
        setRecoveryCode('');
    };

    const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRecoveryCode(e.target.value);
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Two-Factor Authentication" />
            
            <div className="w-full max-w-sm md:max-w-3xl">
                <TwoFactorChallengeForm 
                    onSubmit={handleSubmit}
                    onRecoverySubmit={handleRecoverySubmit}
                    onToggleMode={handleToggleMode}
                    errors={errors}
                    processing={processing}
                    showRecovery={showRecovery}
                    code={code}
                    onCodeChange={setCode}
                    recoveryCode={recoveryCode}
                    onRecoveryCodeChange={handleRecoveryCodeChange}
                />
            </div>
        </div>
    );
}
