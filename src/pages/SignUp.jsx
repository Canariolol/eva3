import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    createUserWithEmailAndPassword, 
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // <-- RUTA CORREGIDA
import AuthForm from '../components/ui/AuthForm'; // <-- RUTA CORREGIDA

const SignUp = () => {
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Lógica para el registro con email y contraseña
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!fullName) {
            setError('Por favor, ingresa tu nombre completo.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            // 1. Crear usuario en Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Actualizar perfil de Auth con el nombre
            await updateProfile(user, { displayName: fullName });

            // 3. Obtener companyId de los Custom Claims (asignados por la Cloud Function)
            const tokenResult = await user.getIdTokenResult(true);
            const companyId = tokenResult.claims.companyId;
            if (!companyId) throw new Error("No se pudo obtener el ID de la compañía.");

            // 4. Determinar nombre de compañía y guardarlo en Firestore
            const finalCompanyName = companyName.trim() === '' ? fullName.trim() : companyName.trim();
            const headerInfoRef = doc(db, 'companies', companyId, 'headerInfo', 'main');
            await setDoc(headerInfoRef, { 
                company: finalCompanyName,
                manager: fullName
            }, { merge: true });
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            console.error("Error durante el registro:", err);
        } finally {
            setLoading(false);
        }
    };

    // Lógica para el registro/inicio de sesión con Google
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Si el usuario es nuevo, la Cloud Function se encargará de crearle su compañía.
            // Si ya existe, simplemente iniciará sesión. La redirección es automática.
            navigate('/dashboard');
        } catch (err) {
            setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
            console.error("Error con Google Sign-In:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            isSignUp={true} // Le decimos al componente que es para Sign Up
            onSubmit={handleSignUp}
            loading={loading}
            error={error}
            fullName={fullName}
            setFullName={setFullName}
            companyName={companyName}
            setCompanyName={setCompanyName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onGoogleSignIn={handleGoogleSignIn} // Pasamos la misma función de Google
        />
    );
};

export default SignUp;
