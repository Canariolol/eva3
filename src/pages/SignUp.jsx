import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();

    const handleEmailSignUp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.email.split('@')[0], // Default display name
                createdAt: serverTimestamp(),
                role: 'freeUser'
            });

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                createdAt: serverTimestamp(),
                role: 'freeUser'
            }, { merge: true }); // Use merge to not overwrite if user already exists from another method

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary">Crear una Cuenta</h1>
                    <p className="text-gray-500">Únete a TeamInsight para empezar a mejorar tu equipo.</p>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button 
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                >
                    <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.566,44,30.85,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    Registrarse con Google
                </button>

                <div className="flex items-center">
                    <hr className="flex-grow border-gray-300" />
                    <span className="mx-4 text-gray-500">o</span>
                    <hr className="flex-grow border-gray-300" />
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Registrarse
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600">
                    ¿Ya tengo una cuenta?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                        Iniciar Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
