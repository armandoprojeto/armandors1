import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Componente principal da aplicação
const App = () => {
    // Configurações e variáveis globais do Firebase
    // As variáveis __app_id, __firebase_config, __initial_auth_token são injetadas pelo ambiente Canvas.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Configuração de fallback do Firebase se __firebase_config não estiver definida pelo ambiente
    // PARA USO EM PRODUÇÃO: VOCÊ PRECISA GARANTIR QUE SUAS CREDENCIAIS REAIS DO FIREBASE
    // SEJAM INJETADAS PELO AMBIENTE OU SUBSTITUA ESTE OBJETO PELAS SUAS CREDENCIAIS.
    const defaultFirebaseConfig = {
        apiKey: "AIzaSyD0MkcbzP4ygxaVgTxJckNP42J4YqvxFy0",
        authDomain: "login-56fda.firebaseapp.com",
        projectId: "login-56fda",
        storageBucket: "login-56fda.firebasestorage.app",
        messagingSenderId: "21549012582",
        appId: "1:21549012582:web:93c4020cfbc6741a877fa7",
        measurementId: "G-SVNXXJ2N4T"

    };
    const firebaseConfig = typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0
        ? JSON.parse(__firebase_config)
        : defaultFirebaseConfig; // Usa o fallback se a config do ambiente estiver vazia ou indefinida

    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Estados para instâncias do Firebase
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // Novo estado para indicar se a autenticação está pronta

    // Estados para armazenar os dados do formulário
    const [formData, setFormData] = useState({
        nomeCompleto: '',
        cpf: '',
        telefone: '',
        email: '',
        tipoLocal: '', // Novo campo: tipo de local
        // Campos para Residência
        rua: '',
        numero: '',
        complemento: '', // Novo campo: apartamento/bloco
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        // Campos para Banca de Feirinha
        numeroBanca: '', // Novo campo: número da banca
        corredor: '',    // Novo campo: corredor (A-Z)
        planoInteresse: '',
        observacoes: '',
    });

    // Estado para controlar a mensagem de sucesso após o envio
    const [submissionMessage, setSubmissionMessage] = useState('');

    // Estados para controlar mensagens de erro para cada campo
    const [errors, setErrors] = useState({});

    // Efeito para inicializar o Firebase e autenticar o usuário
    useEffect(() => {
        // Verifica se as configurações do Firebase estão disponíveis (mesmo que seja o fallback)
        if (Object.keys(firebaseConfig).length === 0 || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
            console.warn("Using placeholder Firebase config. Please provide your actual Firebase credentials for full functionality.");
            setSubmissionMessage('Atenção: Usando configuração de Firebase placeholder. Por favor, forneça suas credenciais reais.');
            // Permite que o app continue, mas as operações de DB falharão sem credenciais reais
            // O `db` e `auth` podem não ser inicializados corretamente com credenciais falsas.
            setIsAuthReady(true); // Marca como pronto para não bloquear o UI, mas o DB não funcionará.
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestore);
            setAuth(firebaseAuth);

            // Listener para o estado de autenticação
            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Se não houver usuário logado, tenta autenticar com o token personalizado
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth); // Autenticação anônima se não houver token
                        }
                        // Garante que userId é definido, mesmo para anônimos
                        setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                    } catch (error) {
                        console.error("Erro na autenticação:", error);
                        setSubmissionMessage(`Erro na autenticação: ${error.message}. Por favor, tente novamente.`);
                    }
                }
                setIsAuthReady(true); // Marca a autenticação como pronta
            });

            // Cleanup do listener na desmontagem do componente
            return () => unsubscribe();
        } catch (error) {
            console.error("Erro na inicialização do Firebase:", error);
            setSubmissionMessage(`Erro ao inicializar o aplicativo: ${error.message}.`);
        }
    }, [firebaseConfig, initialAuthToken]); // Dependências do useEffect

    // Manipulador de mudança para atualizar o estado do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Limpa o erro do campo quando o usuário começa a digitar
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    // Função de validação do formulário
    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        // Campos obrigatórios comuns a ambos os tipos de local
        const commonRequiredFields = [
            'nomeCompleto', 'cpf', 'telefone', 'email', 'tipoLocal', 'planoInteresse'
        ];

        commonRequiredFields.forEach(field => {
            if (!formData[field].trim()) {
                newErrors[field] = 'Este campo é obrigatório.';
                isValid = false;
            }
        });

        // Campos obrigatórios condicionais baseados no 'tipoLocal'
        if (formData.tipoLocal === 'residencia') {
            const residenciaRequiredFields = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
            residenciaRequiredFields.forEach(field => {
                if (!formData[field].trim()) {
                    newErrors[field] = 'Este campo é obrigatório.';
                    isValid = false;
                }
            });
        } else if (formData.tipoLocal === 'feirinha') {
            const feirinhaRequiredFields = ['numeroBanca', 'corredor'];
            feirinhaRequiredFields.forEach(field => {
                if (!formData[field].trim()) {
                    newErrors[field] = 'Este campo é obrigatório.';
                    isValid = false;
                }
            });
        }

        // Validação de e-mail
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'E-mail inválido.';
            isValid = false;
        }

        // Validação de CPF (básica, sem algoritmo de validação)
        if (formData.cpf && !/^\d{11}$/.test(formData.cpf)) {
            newErrors.cpf = 'CPF deve conter 11 dígitos numéricos.';
            isValid = false;
        }

        // Validação de Telefone (básica)
        if (formData.telefone && !/^\d{10,11}$/.test(formData.telefone)) {
            newErrors.telefone = 'Telefone deve conter 10 ou 11 dígitos numéricos (com DDD).';
            isValid = false;
        }

        // Validação de CEP (básica)
        if (formData.cep && formData.tipoLocal === 'residencia' && !/^\d{8}$/.test(formData.cep)) {
            newErrors.cep = 'CEP deve conter 8 dígitos numéricos.';
            isValid = false;
        }

        // Validação de Corredor (A-Z, sem distinção de maiúsculas/minúsculas)
        if (formData.corredor && formData.tipoLocal === 'feirinha' && !/^[A-Z]$/i.test(formData.corredor)) {
            newErrors.corredor = 'Corredor deve ser uma única letra de A a Z.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Manipulador de envio do formulário
    const handleSubmit = async (e) => { // Tornando a função assíncrona
        e.preventDefault(); // Impede o comportamento padrão de recarregar a página

        // Verifica se o Firebase está pronto para uso
        if (!isAuthReady || !db || !userId) {
            setSubmissionMessage('Aguarde a inicialização e autenticação do aplicativo.');
            return;
        }

        if (validateForm()) {
            try {
                // Define o nome da coleção com base no tipo de local
                // Isso garante que as solicitações de "feirinha" e "residência" sejam salvas em coleções separadas.
                const colecaoBase = formData.tipoLocal === 'feirinha' ? 'feirinha-clientes' : 'residencia-clientes';
                // Constrói o caminho completo da coleção de acordo com as regras do Canvas
                const fullCollectionPath = `artifacts/${appId}/public/data/${colecaoBase}`;

                // Dados a serem salvos no Firestore
                await addDoc(collection(db, fullCollectionPath), {
                    nome: formData.nomeCompleto,
                    cpf: formData.cpf,
                    contato: formData.telefone,
                    email: formData.email,
                    local: formData.tipoLocal,
                    // Campos específicos para Residência (serão incluídos se o tipoLocal for 'residencia')
                    ...(formData.tipoLocal === 'residencia' && {
                        rua: formData.rua,
                        numero: formData.numero,
                        complemento: formData.complemento,
                        bairro: formData.bairro,
                        cidade: formData.cidade,
                        estado: formData.estado,
                        cep: formData.cep,
                    }),
                    // Campos específicos para Feirinha (serão incluídos se o tipoLocal for 'feirinha')
                    ...(formData.tipoLocal === 'feirinha' && {
                        numeroBanca: formData.numeroBanca,
                        corredor: formData.corredor,
                    }),
                    plano: formData.planoInteresse,
                    observacoes: formData.observacoes,
                    status: 'desativado', // Novo campo
                    pago: 'não',        // Novo campo
                    pppoe: '',          // Novo campo
                    senha: '',          // Novo campo
                    velocidade: '',     // Novo campo
                    valor: '',          // Novo campo
                    criadoEm: serverTimestamp(), // Usa serverTimestamp() para consistência e precisão
                    userId: userId // Adiciona o ID do usuário que enviou a solicitação
                });

                console.log('Dados do formulário enviados e salvos no Firestore:', formData);
                setSubmissionMessage('✅ Solicitação enviada com sucesso!');
                // Limpa o formulário após o envio
                setFormData({
                    nomeCompleto: '',
                    cpf: '',
                    telefone: '',
                    email: '',
                    tipoLocal: '',
                    rua: '',
                    numero: '',
                    complemento: '',
                    bairro: '',
                    cidade: '',
                    estado: '',
                    cep: '',
                    numeroBanca: '',
                    corredor: '',
                    planoInteresse: '',
                    observacoes: '',
                });
                setErrors({}); // Limpa os erros também
            } catch (error) {
                console.error("Erro ao salvar no Firestore:", error);
                setSubmissionMessage(`❌ Erro ao enviar sua solicitação: ${error.message}. Por favor, tente novamente.`);
            }
        } else {
            setSubmissionMessage('Por favor, preencha todos os campos obrigatórios corretamente.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 hover:scale-[1.01]">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-800 mb-4 sm:mb-6 border-b-4 border-blue-300 pb-2">
                    Solicitação de Internet
                </h1>
                <p className="text-center text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg">
                    Preencha o formulário abaixo para solicitar um orçamento ou demonstrar interesse em nossos planos de internet. Entraremos em contato o mais breve possível!
                </p>

                {submissionMessage && (
                    <div
                        className={`p-4 mb-6 rounded-lg text-center font-semibold text-sm sm:text-base ${submissionMessage.includes('sucesso')
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                    >
                        {submissionMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seção Dados Pessoais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label htmlFor="nomeCompleto" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="nomeCompleto"
                                name="nomeCompleto"
                                value={formData.nomeCompleto}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.nomeCompleto ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Seu nome completo"
                                aria-label="Nome Completo"
                            />
                            {errors.nomeCompleto && <p className="text-red-500 text-xs italic mt-1">{errors.nomeCompleto}</p>}
                        </div>

                        <div>
                            <label htmlFor="cpf" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                CPF <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="cpf"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.cpf ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="000.000.000-00 (apenas números)"
                                aria-label="CPF"
                                maxLength="11"
                            />
                            {errors.cpf && <p className="text-red-500 text-xs italic mt-1">{errors.cpf}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label htmlFor="telefone" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                Telefone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="telefone"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.telefone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="(XX) 9XXXX-XXXX (apenas números)"
                                aria-label="Telefone"
                                maxLength="11"
                            />
                            {errors.telefone && <p className="text-red-500 text-xs italic mt-1">{errors.telefone}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                E-mail <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="seuemail@exemplo.com"
                                aria-label="E-mail"
                            />
                            {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    {/* Seção Tipo de Local */}
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-blue-200 pb-2">Tipo de Local</h2>
                    <div>
                        <label htmlFor="tipoLocal" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                            Onde será a instalação? <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="tipoLocal"
                            name="tipoLocal"
                            value={formData.tipoLocal}
                            onChange={handleChange}
                            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.tipoLocal ? 'border-red-500' : 'border-gray-300'
                                }`}
                            aria-label="Tipo de Local"
                        >
                            <option value="">Selecione o tipo de local</option>
                            <option value="residencia">Residência (Casa/Apartamento)</option>
                            <option value="feirinha">Feirinha (Banca)</option>
                        </select>
                        {errors.tipoLocal && <p className="text-red-500 text-xs italic mt-1">{errors.tipoLocal}</p>}
                    </div>

                    {/* Seção Endereço Condicional - Residência */}
                    {formData.tipoLocal === 'residencia' && (
                        <>
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-blue-200 pb-2">Endereço da Residência</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label htmlFor="rua" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Rua <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="rua"
                                        name="rua"
                                        value={formData.rua}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.rua ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nome da rua"
                                        aria-label="Rua"
                                    />
                                    {errors.rua && <p className="text-red-500 text-xs italic mt-1">{errors.rua}</p>}
                                </div>
                                <div>
                                    <label htmlFor="numero" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Número <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="numero"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.numero ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Número da casa"
                                        aria-label="Número"
                                    />
                                    {errors.numero && <p className="text-red-500 text-xs italic mt-1">{errors.numero}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label htmlFor="complemento" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Apartamento / Bloco (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 border-gray-300 text-sm sm:text-base"
                                        placeholder="Ex: Apt 101, Bloco B"
                                        aria-label="Apartamento / Bloco"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bairro" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Bairro <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="bairro"
                                        name="bairro"
                                        value={formData.bairro}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.bairro ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nome do bairro"
                                        aria-label="Bairro"
                                    />
                                    {errors.bairro && <p className="text-red-500 text-xs italic mt-1">{errors.bairro}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label htmlFor="cidade" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Cidade <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="cidade"
                                        name="cidade"
                                        value={formData.cidade}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.cidade ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Sua cidade"
                                        aria-label="Cidade"
                                    />
                                    {errors.cidade && <p className="text-red-500 text-xs italic mt-1">{errors.cidade}</p>}
                                </div>
                                <div>
                                    <label htmlFor="estado" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Estado <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.estado ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Seu estado (Ex: SP)"
                                        aria-label="Estado"
                                        maxLength="2"
                                    />
                                    {errors.estado && <p className="text-red-500 text-xs italic mt-1">{errors.estado}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="cep" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                    CEP <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="cep"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.cep ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="00000-000 (apenas números)"
                                    aria-label="CEP"
                                    maxLength="8"
                                />
                                {errors.cep && <p className="text-red-500 text-xs italic mt-1">{errors.cep}</p>}
                            </div>
                        </>
                    )}

                    {/* Seção Endereço Condicional - Feirinha */}
                    {formData.tipoLocal === 'feirinha' && (
                        <>
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-blue-200 pb-2">Dados da Feirinha</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label htmlFor="numeroBanca" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Número da Banca <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="numeroBanca"
                                        name="numeroBanca"
                                        value={formData.numeroBanca}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.numeroBanca ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Número da sua banca"
                                        aria-label="Número da Banca"
                                    />
                                    {errors.numeroBanca && <p className="text-red-500 text-xs italic mt-1">{errors.numeroBanca}</p>}
                                </div>
                                <div>
                                    <label htmlFor="corredor" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                                        Corredor <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="corredor"
                                        name="corredor"
                                        value={formData.corredor}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.corredor ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Letra do corredor (A-Z)"
                                        aria-label="Corredor"
                                        maxLength="1"
                                    />
                                    {errors.corredor && <p className="text-red-500 text-xs italic mt-1">{errors.corredor}</p>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Seção Plano de Interesse */}
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-blue-200 pb-2">Plano Desejado</h2>
                    <div>
                        <label htmlFor="planoInteresse" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                            Plano de Interesse <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="planoInteresse"
                            name="planoInteresse"
                            value={formData.planoInteresse}
                            onChange={handleChange}
                            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-sm sm:text-base ${errors.planoInteresse ? 'border-red-500' : 'border-gray-300'
                                }`}
                            aria-label="Plano de Interesse"
                        >
                            <option value="">Selecione um plano</option>
                            <option value="100mbps">100 Mbps - Residencial</option>
                            <option value="300mbps">300 Mbps - Residencial</option>
                            <option value="500mbps">500 Mbps - Residencial</option>
                            <option value="fibra_empresarial">Fibra Óptica - Empresarial</option>
                            <option value="outros">Outros / Não sei</option>
                        </select>
                        {errors.planoInteresse && <p className="text-red-500 text-xs italic mt-1">{errors.planoInteresse}</p>}
                    </div>

                    {/* Seção Observações */}
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-blue-200 pb-2">Observações</h2>
                    <div>
                        <label htmlFor="observacoes" className="block text-gray-700 text-sm sm:text-base font-bold mb-1 sm:mb-2">
                            Observações / Dúvidas
                        </label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            rows="4"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 sm:py-3 sm:px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 border-gray-300 text-sm sm:text-base"
                            placeholder="Ex: Melhor horário para contato, dúvidas sobre cobertura, etc."
                            aria-label="Observações"
                        ></textarea>
                    </div>

                    {/* Botão de Envio */}
                    <div className="flex justify-center mt-8 sm:mt-10">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 text-base sm:text-lg"
                            aria-label="Enviar Solicitação"
                        >
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default App;