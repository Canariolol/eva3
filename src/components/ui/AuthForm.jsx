"use client"

import React from "react";
import { ChevronLeft, Github, Twitter, Mail, Lock, User, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../../context/GlobalContext"; // Adaptado a tu estructura

// --- COMPONENTE PRINCIPAL ---
// Este es el componente reutilizable que usaremos para Login y Sign Up.
// Acepta props para personalizarlo según la página.
const AuthForm = ({
  isSignUp = false,
  onSubmit,
  loading,
  error,
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  email,
  setEmail,
  password,
  setPassword,
  onGoogleSignIn, // Prop para la función de Google
}) => {
  const { darkMode } = useGlobalContext();

  return (
    <div className={`py-20 text-zinc-800 selection:bg-zinc-300 ${darkMode ? 'dark bg-zinc-950 text-zinc-200 selection:bg-zinc-600' : 'bg-white'}`}>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <Logo />
        <Header isSignUp={isSignUp} />
        <SocialButtons onGoogleSignIn={onGoogleSignIn} />
        <Divider />
        <AuthFormFields
          isSignUp={isSignUp}
          onSubmit={onSubmit}
          loading={loading}
          fullName={fullName}
          setFullName={setFullName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
        <TermsAndConditions />
      </motion.div>
      <BackgroundDecoration />
    </div>
  );
};

// --- SUBCOMPONENTES ---

const Button = ({ children, className, ...props }) => (
  <button
    className={`rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 
    transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Logo = () => (
  <div className="mb-6 flex justify-center items-center">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-700 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">E³</span>
    </div>
    <span className="ml-3 text-2xl font-bold">Eva3</span>
  </div>
);

const Header = ({ isSignUp }) => (
  <div className="mb-6 text-center">
    <h1 className="text-2xl font-semibold">{isSignUp ? 'Crea una nueva cuenta' : 'Inicia sesión en tu cuenta'}</h1>
    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
      {isSignUp ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
      <Link to={isSignUp ? "/login" : "/signup"} className="text-blue-600 dark:text-blue-400 hover:underline">
        {isSignUp ? "Inicia sesión." : "Crea una."}
      </Link>
    </p>
  </div>
);

const SocialButtons = ({ onGoogleSignIn }) => (
    <SocialButton onClick={onGoogleSignIn} fullWidth>
        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.018 35.17 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
        </svg>
        Continuar con Google
    </SocialButton>
);

const SocialButton = ({ children, fullWidth, ...props }) => (
  <button
    {...props}
    className={`relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md 
    border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 
    px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-500
    before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5]
    before:rounded-[100%] before:bg-zinc-800 dark:before:bg-zinc-200 before:transition-transform before:duration-1000 before:content-[""]
    hover:scale-105 hover:text-zinc-100 dark:hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95
    ${fullWidth ? "col-span-2" : ""}`}
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-[1px] w-full bg-zinc-300 dark:bg-zinc-700" />
    <span className="text-zinc-500 dark:text-zinc-400">O</span>
    <div className="h-[1px] w-full bg-zinc-300 dark:bg-zinc-700" />
  </div>
);

const AuthFormFields = ({ isSignUp, onSubmit, loading, fullName, setFullName, companyName, setCompanyName, email, setEmail, password, setPassword }) => {
    return (
        <form onSubmit={onSubmit}>
            {isSignUp && (
                <>
                    <InputField id="fullName" label="Nombre Completo" type="text" placeholder="Juana de Arco" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={<User />} />
                    <InputField id="companyName" label="Nombre de Compañía (Opcional)" type="text" placeholder="Si lo dejas en blanco, usaremos tu nombre" value={companyName} onChange={(e) => setCompanyName(e.target.value)} icon={<Briefcase />} />
                </>
            )}
            <InputField id="email" label="Email" type="email" placeholder="tu@compañía.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} />
            <InputField id="password" label="Contraseña" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock />} />
            
            <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </Button>
        </form>
    );
};

const InputField = ({ id, label, type, placeholder, value, onChange, icon }) => (
    <div className="mb-4 relative">
        <label htmlFor={id} className="mb-1.5 block text-zinc-500 dark:text-zinc-400">{label}</label>
        <div className="absolute left-3 top-10 text-zinc-400">{icon}</div>
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
            bg-white dark:bg-zinc-900 pl-10 pr-3 py-2 text-zinc-800 dark:text-zinc-200
            placeholder-zinc-400 dark:placeholder-zinc-500 
            ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
    </div>
);

const TermsAndConditions = () => (
  <p className="mt-9 text-xs text-zinc-500 dark:text-zinc-400 text-center">
    Al continuar, aceptas nuestros{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">Términos y Condiciones</a>{" "}y{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">Política de Privacidad.</a>
  </p>
);

const BackgroundDecoration = () => {
  const { darkMode } = useGlobalContext();
  const isDarkTheme = darkMode;

  return (
    <div
      className="absolute right-0 top-0 z-0 size-[50vw]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDarkTheme
            ? "radial-gradient(100% 100% at 100% 0%, rgba(9,9,11,0), rgba(9,9,11,1))"
            : "radial-gradient(100% 100% at 100% 0%, rgba(255,255,255,0), rgba(255,255,255,1))",
        }}
      />
    </div>
  );
};

export default AuthForm;
