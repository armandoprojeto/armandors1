import React, { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        if (!email || !senha) {
            setErro("Por favor, preencha email e senha.");
            return;
        }

        try {
            // Configura persistência para sessão (dura só enquanto a aba estiver aberta)
            await setPersistence(auth, browserSessionPersistence);

            // Faz login normalmente
            await signInWithEmailAndPassword(auth, email, senha);

            // Redireciona para home/dashboard
            navigate("/");
        } catch (error) {
            if (
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                setErro("Usuário ou senha inválidos");
            } else if (error.code === "auth/too-many-requests") {
                setErro("Muitas tentativas. Tente novamente mais tarde.");
            } else {
                setErro("Erro: " + error.message);
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4 py-8">
            <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 sm:p-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-700 mb-6">
                    Seja bem-vindo!
                </h1>

                {erro && (
                    <p className="mb-4 text-red-600 font-semibold text-center">{erro}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Digite seu email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold text-gray-700" htmlFor="senha">
                            Senha
                        </label>
                        <input
                            id="senha"
                            type="password"
                            placeholder="Digite sua senha"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}
