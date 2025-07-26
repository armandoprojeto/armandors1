import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Componente para a seleção de planos
const PlanSelection = ({ onSelectPlan }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-inter">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-blue-800 mb-6 sm:mb-8 border-b-4 border-blue-300 pb-2">
                Internet de Verdade, para Você Conectar o Mundo!
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-center text-gray-700 mb-8 sm:mb-10 max-w-2xl">
                Experimente a velocidade e estabilidade que você merece. Nossos planos são feitos para garantir sua melhor experiência online.
            </p>

            <div className="flex flex-col md:flex-row gap-8 sm:gap-12 justify-center items-stretch w-full max-w-6xl"> {/* Usado items-stretch para garantir que os cartões tenham a mesma altura */}
                {/* Cartão do Plano 50 MEGA */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl flex flex-col items-center text-center w-full md:w-1/2 lg:w-1/3 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border-t-4 border-blue-500">
                    <h2 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-4">Power conect 50 MEGA</h2>
                    <div className="flex flex-col items-center mb-6"> {/* Agrupamento dos elementos de preço para controle de layout */}
                        <p className="text-5xl sm:text-6xl font-extrabold text-blue-600 mb-2">50 MEGA</p>
                        <p className="text-lg text-gray-500 line-through mb-1">De R$ 99,90</p>
                        <p className="text-4xl sm:text-5xl font-extrabold text-red-600">R$ 79,90<span className="text-xl font-normal">/mês</span></p>
                    </div>
                    <ul className="text-gray-700 text-lg sm:text-xl list-none p-0 mb-8 flex-grow flex flex-col justify-center"> {/* flex-grow para ocupar espaço e justify-center para alinhar verticalmente */}
                        <li className="flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Suporte Premium
                        </li>
                    </ul>
                    <button
                        onClick={() => onSelectPlan("Power conect 50 MEGA")}
                        className="w-full px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 text-lg sm:text-xl shadow-lg mt-auto" /* mt-auto para empurrar o botão para o final do flex container */
                        aria-label="Assinar Plano Power conect 50 MEGA"
                    >
                        Assinar
                    </button>
                </div>

                {/* Cartão do Plano 100 MEGA */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl flex flex-col items-center text-center w-full md:w-1/2 lg:w-1/3 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border-t-4 border-blue-500">
                    <h2 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-4">Power conect 100 MEGA</h2>
                    <div className="flex flex-col items-center mb-6"> {/* Agrupamento dos elementos de preço para controle de layout */}
                        <p className="text-5xl sm:text-6xl font-extrabold text-blue-600 mb-2">100 MEGA</p>
                        <p className="text-lg text-gray-500 invisible mb-1">De R$ 99,90</p> {/* Placeholder invisível para alinhar com o preço "de" do outro cartão */}
                        <p className="text-4xl sm:text-5xl font-extrabold text-red-600">R$ 159,90<span className="text-xl font-normal">/mês</span></p>
                    </div>
                    <ul className="text-gray-700 text-lg sm:text-xl list-none p-0 mb-8 flex-grow flex flex-col justify-center"> {/* flex-grow para ocupar espaço e justify-center para alinhar verticalmente */}
                        <li className="flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Atendimento Prioritário
                        </li>
                    </ul>
                    <button
                        onClick={() => onSelectPlan("Power conect 100 MEGA")}
                        className="w-full px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 text-lg sm:text-xl shadow-lg mt-auto" /* mt-auto para empurrar o botão para o final do flex container */
                        aria-label="Assinar Plano Power conect 100 MEGA"
                    >
                        Assinar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente do Formulário de Solicitação de Internet
const SolicitacaoInternetForm = ({ preselectedPlan, onBackToPlans }) => {
    // Configurações e variáveis globais do Firebase
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const defaultFirebaseConfig = {
        apiKey: "AIzaSyD0MkcbzP4ygxaVgTxJckNP42J4YqvxFy0",
        authDomain: "login-56fda.firebaseapp.com",
        projectId: "login-56fda",
        storageBucket: "login-56fda.firebaseapp.com",
        messagingSenderId: "21549012582",
        appId: "1:21549012582:web:93c4020cfbc6741a877fa7",
        measurementId: "G-SVNXXJ2N4T"
    };

    const firebaseConfig = typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0
        ? JSON.parse(__firebase_config)
        : defaultFirebaseConfig;

    const [db, setDb] = useState(null);
    const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

    const [formData, setFormData] = useState({
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
        planoInteresse: preselectedPlan || '', // Preenche com o plano selecionado ou vazio
        observacoes: '',
    });

    const [submissionMessage, setSubmissionMessage] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        try {
            let app;
            // Verifica se o aplicativo Firebase padrão já foi inicializado
            if (!getApps().some(app => app.name === '[DEFAULT]')) {
                // Se não houver app padrão, inicializa um novo
                app = initializeApp(firebaseConfig);
            } else {
                // Se já houver um app padrão, o utiliza
                app = getApp();
            }
            const firestoreDb = getFirestore(app);
            setDb(firestoreDb);
            setIsFirebaseInitialized(true);
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
            setSubmissionMessage(`❌ Erro ao carregar o aplicativo: ${error.message}.`);
            setIsFirebaseInitialized(false);
        }
    }, [firebaseConfig]);

    // Atualiza o plano preselecionado se a prop mudar
    useEffect(() => {
        if (preselectedPlan) {
            setFormData(prevData => ({
                ...prevData,
                planoInteresse: preselectedPlan
            }));
        }
    }, [preselectedPlan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        const commonRequiredFields = [
            'nomeCompleto', 'cpf', 'telefone', 'email', 'tipoLocal', 'planoInteresse'
        ];

        commonRequiredFields.forEach(field => {
            if (!formData[field].trim()) {
                newErrors[field] = 'Este campo é obrigatório.';
                isValid = false;
            }
        });

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

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'E-mail inválido.';
            isValid = false;
        }

        if (formData.cpf && !/^\d{11}$/.test(formData.cpf)) {
            newErrors.cpf = 'CPF deve conter 11 dígitos numéricos.';
            isValid = false;
        }

        if (formData.telefone && !/^\d{10,11}$/.test(formData.telefone)) {
            newErrors.telefone = 'Telefone deve conter 10 ou 11 dígitos numéricos (com DDD).';
            isValid = false;
        }

        if (formData.cep && formData.tipoLocal === 'residencia' && !/^\d{8}$/.test(formData.cep)) {
            newErrors.cep = 'CEP deve conter 8 dígitos numéricos.';
            isValid = false;
        }

        if (formData.corredor && formData.tipoLocal === 'feirinha' && !/^[A-Z]$/i.test(formData.corredor)) {
            newErrors.corredor = 'Corredor deve ser uma única letra de A a Z.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Função para obter a velocidade e o valor com base no plano
    const getPlanDetails = (planName) => {
        let velocidade = '';
        let valor = '';

        if (planName.includes('50 MEGA')) {
            velocidade = '50 MEGA';
            valor = 'R$ 79,90'; // Valor atualizado de acordo com a imagem
        } else if (planName.includes('100 MEGA')) {
            velocidade = '100 MEGA';
            valor = 'R$ 159,90'; // Valor atualizado de acordo com a imagem
        } else if (planName === 'Outro') {
            velocidade = 'A definir';
            valor = 'A definir';
        }

        return { velocidade, valor };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFirebaseInitialized || !db) {
            setSubmissionMessage('❌ O aplicativo não está pronto para enviar dados. Por favor, tente novamente.');
            return;
        }

        if (validateForm()) {
            try {
                const publicCollectionPath = `solicitacoes-clientes`;

                // Chame a nova função para obter a velocidade e o valor
                const { velocidade, valor } = getPlanDetails(formData.planoInteresse);

                await addDoc(collection(db, publicCollectionPath), {
                    nome: formData.nomeCompleto,
                    cpf: formData.cpf,
                    contato: formData.telefone,
                    email: formData.email,
                    local: formData.tipoLocal,
                    ...(formData.tipoLocal === 'residencia' && {
                        rua: formData.rua,
                        numero: formData.numero,
                        complemento: formData.complemento,
                        bairro: formData.bairro,
                        cidade: formData.cidade,
                        estado: formData.estado,
                        cep: formData.cep,
                    }),
                    ...(formData.tipoLocal === 'feirinha' && {
                        numeroBanca: formData.numeroBanca,
                        corredor: formData.corredor,
                    }),
                    plano: formData.planoInteresse,
                    observacoes: formData.observacoes,
                    status: 'desativado',
                    pago: 'não',
                    pppoe: '',
                    senha: '',
                    velocidade: velocidade,
                    valor: valor,
                    criadoEm: serverTimestamp(),
                });

                setSubmissionMessage('✅ Solicitação enviada com sucesso!');
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
                    planoInteresse: preselectedPlan || '',
                    observacoes: '',
                });
                setErrors({});
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
            <div className="bg-white p-8 sm:p-10 md:p-12 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 hover:scale-[1.01]">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-blue-800 mb-6 sm:mb-8 border-b-4 border-blue-300 pb-2">
                    Solicitação de Internet
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-center text-gray-700 mb-8 sm:mb-10">
                    Preencha o formulário abaixo para solicitar um orçamento ou demonstrar interesse em nossos planos de internet. Entraremos em contato o mais breve possível!
                </p>

                {submissionMessage && (
                    <div
                        className={`p-5 sm:p-6 mb-8 rounded-lg text-center font-semibold text-base sm:text-lg lg:text-xl ${submissionMessage.includes('sucesso')
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                    >
                        {submissionMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
                    {/* Seção Dados Pessoais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div>
                            <label htmlFor="nomeCompleto" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="nomeCompleto"
                                name="nomeCompleto"
                                value={formData.nomeCompleto}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.nomeCompleto ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Seu nome completo"
                                aria-label="Nome Completo"
                            />
                            {errors.nomeCompleto && <p className="text-red-500 text-sm italic mt-1">{errors.nomeCompleto}</p>}
                        </div>

                        <div>
                            <label htmlFor="cpf" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                CPF <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="cpf"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.cpf ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="000.000.000-00 (apenas números)"
                                aria-label="CPF"
                                maxLength="11"
                            />
                            {errors.cpf && <p className="text-red-500 text-sm italic mt-1">{errors.cpf}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div>
                            <label htmlFor="telefone" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                Telefone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="telefone"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.telefone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="(XX) 9XXXX-XXXX (apenas números)"
                                aria-label="Telefone"
                                maxLength="11"
                            />
                            {errors.telefone && <p className="text-red-500 text-sm italic mt-1">{errors.telefone}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                E-mail <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="seuemail@exemplo.com"
                                aria-label="E-mail"
                            />
                            {errors.email && <p className="text-red-500 text-sm italic mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    {/* Seção Tipo de Local */}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mt-8 sm:mt-10 mb-4 sm:mb-5 border-b border-blue-200 pb-2">Tipo de Local</h2>
                    <div>
                        <label htmlFor="tipoLocal" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                            Onde será a instalação? <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="tipoLocal"
                            name="tipoLocal"
                            value={formData.tipoLocal}
                            onChange={handleChange}
                            className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.tipoLocal ? 'border-red-500' : 'border-gray-300'
                                }`}
                            aria-label="Tipo de Local"
                        >
                            <option value="">Selecione o tipo de local</option>
                            <option value="residencia">Residência (Casa/Apartamento)</option>
                            <option value="feirinha">Feirinha (Banca)</option>
                        </select>
                        {errors.tipoLocal && <p className="text-red-500 text-sm italic mt-1">{errors.tipoLocal}</p>}
                    </div>

                    {/* Seção Endereço Condicional - Residência */}
                    {formData.tipoLocal === 'residencia' && (
                        <>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mt-8 sm:mt-10 mb-4 sm:mb-5 border-b border-blue-200 pb-2">Endereço da Residência</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label htmlFor="rua" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Rua <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="rua"
                                        name="rua"
                                        value={formData.rua}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.rua ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nome da rua"
                                        aria-label="Rua"
                                    />
                                    {errors.rua && <p className="text-red-500 text-sm italic mt-1">{errors.rua}</p>}
                                </div>
                                <div>
                                    <label htmlFor="numero" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Número <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="numero"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.numero ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Número da casa"
                                        aria-label="Número"
                                    />
                                    {errors.numero && <p className="text-red-500 text-sm italic mt-1">{errors.numero}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label htmlFor="complemento" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Apartamento / Bloco (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 border-gray-300 text-lg sm:text-xl"
                                        placeholder="Ex: Apt 101, Bloco B"
                                        aria-label="Apartamento / Bloco"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bairro" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Bairro <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="bairro"
                                        name="bairro"
                                        value={formData.bairro}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.bairro ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nome do bairro"
                                        aria-label="Bairro"
                                    />
                                    {errors.bairro && <p className="text-red-500 text-sm italic mt-1">{errors.bairro}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label htmlFor="cidade" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Cidade <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="cidade"
                                        name="cidade"
                                        value={formData.cidade}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.cidade ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Sua cidade"
                                        aria-label="Cidade"
                                    />
                                    {errors.cidade && <p className="text-red-500 text-sm italic mt-1">{errors.cidade}</p>}
                                </div>
                                <div>
                                    <label htmlFor="estado" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Estado <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.estado ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Seu estado (Ex: SP)"
                                        aria-label="Estado"
                                        maxLength="2"
                                    />
                                    {errors.estado && <p className="text-red-500 text-sm italic mt-1">{errors.estado}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="cep" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                    CEP <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="cep"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.cep ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="00000-000 (apenas números)"
                                    aria-label="CEP"
                                    maxLength="8"
                                />
                                {errors.cep && <p className="text-red-500 text-sm italic mt-1">{errors.cep}</p>}
                            </div>
                        </>
                    )}

                    {/* Seção Endereço Condicional - Feirinha */}
                    {formData.tipoLocal === 'feirinha' && (
                        <>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mt-8 sm:mt-10 mb-4 sm:mb-5 border-b border-blue-200 pb-2">Dados da Feirinha</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label htmlFor="numeroBanca" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Número da Banca <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="numeroBanca"
                                        name="numeroBanca"
                                        value={formData.numeroBanca}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.numeroBanca ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Número da sua banca"
                                        aria-label="Número da Banca"
                                    />
                                    {errors.numeroBanca && <p className="text-red-500 text-sm italic mt-1">{errors.numeroBanca}</p>}
                                </div>
                                <div>
                                    <label htmlFor="corredor" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                                        Corredor <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="corredor"
                                        name="corredor"
                                        value={formData.corredor}
                                        onChange={handleChange}
                                        className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.corredor ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Letra do corredor (A-Z)"
                                        aria-label="Corredor"
                                        maxLength="1"
                                    />
                                    {errors.corredor && <p className="text-red-500 text-sm italic mt-1">{errors.corredor}</p>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Seção Plano de Interesse */}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mt-8 sm:mt-10 mb-4 sm:mb-5 border-b border-blue-200 pb-2">Plano Desejado</h2>
                    <div>
                        <label htmlFor="planoInteresse" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                            Plano de Interesse <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="planoInteresse"
                            name="planoInteresse"
                            value={formData.planoInteresse}
                            onChange={handleChange}
                            disabled={!!preselectedPlan} // Desabilita se um plano já foi preselecionado
                            className={`shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg sm:text-xl ${errors.planoInteresse ? 'border-red-500' : 'border-gray-300'
                                } ${preselectedPlan ? 'bg-gray-100 cursor-not-allowed' : '' // Estilo para campo desabilitado
                                }`}
                            aria-label="Plano de Interesse"
                        >
                            <option value="">Selecione um plano</option>
                            <option value="Power conect 50 MEGA">Power conect 50 MEGA</option>
                            <option value="Power conect 100 MEGA">Power conect 100 MEGA</option>
                            <option value="Outro">Outro (especifique nas observações)</option>
                        </select>
                        {errors.planoInteresse && <p className="text-red-500 text-sm italic mt-1">{errors.planoInteresse}</p>}
                    </div>

                    {/* Campo de Observações */}
                    <div>
                        <label htmlFor="observacoes" className="block text-gray-700 text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                            Observações (Opcional)
                        </label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded-lg w-full py-4 px-5 sm:py-5 sm:px-6 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 border-gray-300 text-lg sm:text-xl"
                            placeholder="Ex: Apt 101, Bloco B"
                            aria-label="Apartamento / Bloco"
                        ></textarea>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 mt-8 sm:mt-10">
                        {onBackToPlans && (
                            <button
                                type="button"
                                onClick={onBackToPlans}
                                className="w-full sm:w-auto px-8 py-4 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-200 text-lg sm:text-xl"
                                aria-label="Voltar para a seleção de planos"
                            >
                                Voltar para Planos
                            </button>
                        )}
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 text-lg sm:text-xl"
                            aria-label="Enviar solicitação"
                        >
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente principal da aplicação
export default function App() {
    const [selectedPlan, setSelectedPlan] = useState(null);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
    };

    const handleBackToPlans = () => {
        setSelectedPlan(null);
    };

    return (
        <div className="App">
            {selectedPlan ? (
                <SolicitacaoInternetForm
                    preselectedPlan={selectedPlan}
                    onBackToPlans={handleBackToPlans}
                />
            ) : (
                <PlanSelection onSelectPlan={handleSelectPlan} />
            )}
        </div>
    );
}
