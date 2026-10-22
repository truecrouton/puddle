'use client';

import { useState } from 'react';
import { SIGN_IN } from '@/lib/queries';
import { useMutation } from '@apollo/client/react';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { zodSignInInputSchema } from 'puddle-graphql';
import ErrorAlert from './ErrorAlert';
import { redirect } from 'next/navigation';

export default function SignInForm() {
    const [alertError, setAlertError] = useState('');

    const [signIn, { loading: signInPending, error: signInError }] = useMutation(SIGN_IN);

    type UserData = z.infer<typeof zodSignInInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodSignInInputSchema),
        values: {
            username: '',
            password: ''
        }
    });

    const onSubmit = async (data: UserData) => {
        setAlertError('');
        try {
            await signIn({
                variables: {
                    input: data
                }
            });
        }
        catch (error) {
            console.error(error);
            setAlertError((error as Error).message);
        }

        reset({
            username: '',
            password: ''
        });

        redirect('/dashboard');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} onChange={() => setAlertError('')}>
            <ErrorAlert message={alertError} />
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4" disabled={signInPending}>
                <legend className="fieldset-legend">Sign In</legend>

                <InputFieldset label='Username' error={errors.username} {...register("username")} />
                <InputFieldset label='Password' error={errors.password} {...register("password")} />
                <button type="submit" className={`btn btn-primary ${signInPending ? 'loading' : ''}`}>
                    {signInPending ? 'Signing in...' : 'Sign In'}
                </button>
            </fieldset>
        </form>
    );
}