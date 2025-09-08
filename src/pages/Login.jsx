import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase'; // <-- RUTA CORREGIDA
import AuthForm from '../components/ui/AuthForm'; // <-- RUTA CORREGIDA

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Lógica para el inicio de sesión con email y contraseña
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
            console.error("Error durante el inicio de sesión:", err);
        } finally {
            setLoading(false);
        }
    };

    // Lógica para el inicio de sesión con Google
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // La redirección al dashboard se manejará automáticamente por el observer de AuthContext
            navigate('/dashboard');
        } catch (err) {
            setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
            console.error("Error durante el inicio de sesión con Google:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            isSignUp={false} // Le decimos al componente que es para Login
            onSubmit={handleLogin}
            loading={loading}
            error={error}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onGoogleSignIn={handleGoogleSignIn} // Pasamos la función de Google
        />
    );
};

export default Login;
