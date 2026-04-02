import React, { useState } from 'react';
import '../view-styles/LoginForm.css';
import { FaUser, FaEnvelope } from "react-icons/fa6";
import { FaLock } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';

const LoginForm = () => {
    console.log("hi from the login");
    const [action, setAction] = useState('');
    const [faqOpenIndex, setFaqOpenIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const registerLink = () => {
        setAction(' active');
    };

    const loginLink = () => {
        setAction('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const name = e.target[0].value;
        const password = e.target[1].value;

        try {
            const response = await fetch(api("/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert("Invalid credentials");
                return;
            }

            // Save auth context in localStorage
            localStorage.setItem("token", data.token);
            if (data?.user?.role) {
                localStorage.setItem("role", data.user.role);
            } else {
                localStorage.removeItem("role");
            }

            if (data?.user?.role === "tenant") {
                navigate("/home");
            } else {
                navigate("/viviendas");
            }

        } catch (error) {
            console.error(error);
            alert("Server error");
        }
    };

    return (
        <div className='login-page'>
            <div className={`wrapper${action}`}>
                <div className='form-box login'>
                    <form onSubmit={handleLogin}>
                        <h1>Administración de Rentas</h1>
                        <div className="input-box">
                            <input type="text" placeholder='Username' required /> <FaUser className='icon' />
                        </div>

                        <div className="input-box">
                            <input type="password" placeholder='Password' required /> <FaLock className='icon' />
                        </div>
                        <div className="remember-forgot">
                            <label><input type='checkbox' />Recuerdame</label>
                            <a href='#'> </a>
                        </div>

                        <button type="submit" className="btn btn-dark w-100">Login</button>

                        <div className="register-link">
                            <p> <a href='#' onClick={registerLink}> </a>
                            </p>
                        </div>
                        <div className="input-fuaq">
                            <p>Al continuar, usted acepta los Términos de Sistema de Administración de Rentas y reconoce haber leído nuestra <span className="privacy-link" onClick={toggleModal}>Política de Privacidad</span>. Aviso de recopilación de información.
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay2" onClick={toggleModal}>
                    <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close2" onClick={toggleModal}>&times;</button>
                        <h2>Términos y Políticas de Privacidad</h2>
                        <p><strong>1. Introducción</strong><br />
                            Bienvenido a Administración de Rentas. Valoramos su privacidad y estamos comprometidos a proteger sus datos personales. Esta política le informará cómo cuidamos sus datos personales y sus derechos.
                        </p>
                        <p><strong>2. Los datos que recopilamos</strong><br />
                            Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre usted: Datos de identidad, datos de contacto, datos financieros y datos de transacciones.
                        </p>
                        <p><strong>3. Cómo usamos sus datos</strong><br />
                            Solo utilizaremos sus datos personales cuando la ley nos lo permita. Lo más común es utilizarlos para formalizar y cumplir contratos con usted o respaldar nuestros intereses legítimos.
                        </p>
                        <p><strong>4. Seguridad</strong><br />
                            Hemos implementado medidas de seguridad apropiadas para evitar que sus datos personales se pierdan, utilicen o accedan accidentalmente de manera no autorizada.
                        </p>
                        <p><strong>5. Sus derechos</strong><br />
                            En ciertas circunstancias, usted tiene derechos según las leyes de protección de datos con respecto a sus datos personales (solicitar acceso, corrección, eliminación, restricción, etc.).
                        </p>
                        <button className="btn btn-dark w-100" style={{ marginTop: "15px" }} onClick={toggleModal}>Cerrar / Entendido</button>
                    </div>
                </div>
            )}

        </div>
    )
}

export default LoginForm;