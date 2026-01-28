--
-- PostgreSQL database dump
--

\restrict yx8jcJkddIn93GhdwPXUGf6iBkf9Vb21hBdgI2gTJijgASpp3QUdOoHrvMrF7Mf

-- Dumped from database version 17.7 (Ubuntu 17.7-0ubuntu0.25.10.1)
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-0ubuntu0.25.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: generate_monthly_report(integer, integer); Type: PROCEDURE; Schema: public; Owner: agro_admin
--

CREATE PROCEDURE public.generate_monthly_report(IN month integer, IN year integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    report_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'month', month,
        'year', year,
        'total_transactions', COUNT(*),
        'total_volume', COALESCE(SUM(price * quantity), 0),
        'avg_transaction_value', COALESCE(AVG(price * quantity), 0),
        'completed_transactions', COUNT(CASE WHEN status = 'completo' THEN 1 END),
        'new_users', (SELECT COUNT(*) FROM users WHERE EXTRACT(MONTH FROM created_at) = month AND EXTRACT(YEAR FROM created_at) = year)
    ) INTO report_data
    FROM transactions
    WHERE EXTRACT(MONTH FROM created_at) = month 
      AND EXTRACT(YEAR FROM created_at) = year;
    
    -- Aquí podrías insertar en una tabla de reportes o enviar por email
    RAISE NOTICE 'Reporte generado para %/%: %', month, year, report_data;
END;
$$;


ALTER PROCEDURE public.generate_monthly_report(IN month integer, IN year integer) OWNER TO agro_admin;

--
-- Name: generate_transaction_code(); Type: FUNCTION; Schema: public; Owner: agro_admin
--

CREATE FUNCTION public.generate_transaction_code() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    code VARCHAR(20);
BEGIN
    code := 'TXN-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    RETURN code;
END;
$$;


ALTER FUNCTION public.generate_transaction_code() OWNER TO agro_admin;

--
-- Name: get_age_in_days(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: agro_admin
--

CREATE FUNCTION public.get_age_in_days(timestamp_val timestamp without time zone) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp_val))/86400)::INTEGER;
END;
$$;


ALTER FUNCTION public.get_age_in_days(timestamp_val timestamp without time zone) OWNER TO agro_admin;

--
-- Name: is_lote_expired(integer); Type: FUNCTION; Schema: public; Owner: agro_admin
--

CREATE FUNCTION public.is_lote_expired(lote_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    expiry_date TIMESTAMP;
BEGIN
    SELECT expires_at INTO expiry_date FROM lotes WHERE id = lote_id;
    RETURN (expiry_date IS NOT NULL AND expiry_date < CURRENT_TIMESTAMP);
END;
$$;


ALTER FUNCTION public.is_lote_expired(lote_id integer) OWNER TO agro_admin;

--
-- Name: update_expired_lotes(); Type: PROCEDURE; Schema: public; Owner: agro_admin
--

CREATE PROCEDURE public.update_expired_lotes()
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE lotes 
    SET status = 'cancelado',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'ofertado' 
      AND expires_at IS NOT NULL 
      AND expires_at < CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Lotes expirados actualizados: %', FOUND;
END;
$$;


ALTER PROCEDURE public.update_expired_lotes() OWNER TO agro_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: agro_admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO agro_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO agro_admin;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO agro_admin;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: answers; Type: TABLE; Schema: public; Owner: agro_user
--

CREATE TABLE public.answers (
    id integer NOT NULL,
    question_id integer NOT NULL,
    seller_id integer NOT NULL,
    answer_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_blocked boolean DEFAULT false,
    CONSTRAINT check_answer_text_length CHECK ((char_length(answer_text) <= 1000))
);


ALTER TABLE public.answers OWNER TO agro_user;

--
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_user
--

CREATE SEQUENCE public.answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.answers_id_seq OWNER TO agro_user;

--
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_user
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- Name: bank_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_integrations (
    id integer NOT NULL,
    bank_id integer NOT NULL,
    api_key character varying(64) NOT NULL,
    api_secret character varying(128) NOT NULL,
    webhook_url character varying(500),
    webhook_secret character varying(64),
    is_active boolean DEFAULT true,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bank_integrations OWNER TO postgres;

--
-- Name: TABLE bank_integrations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bank_integrations IS 'Configuración de integración API para bancos';


--
-- Name: bank_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_integrations_id_seq OWNER TO postgres;

--
-- Name: bank_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_integrations_id_seq OWNED BY public.bank_integrations.id;


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.certifications (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    user_id integer,
    bank_name character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pendiente'::character varying,
    notes text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    approved_amount numeric(15,2),
    interest_rate numeric(5,2),
    term_months integer,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    personal_info jsonb DEFAULT '{}'::jsonb,
    employment_info jsonb DEFAULT '{}'::jsonb,
    income_proof_path character varying(500),
    buyer_status character varying(50) DEFAULT 'pendiente_aprobacion'::character varying,
    financial_info jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT certifications_status_check CHECK (((status)::text = ANY ((ARRAY['pendiente_aprobacion'::character varying, 'aprobado'::character varying, 'rechazado'::character varying, 'mas_datos'::character varying])::text[])))
);


ALTER TABLE public.certifications OWNER TO agro_admin;

--
-- Name: COLUMN certifications.personal_info; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.certifications.personal_info IS 'Información personal del solicitante (JSON)';


--
-- Name: COLUMN certifications.employment_info; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.certifications.employment_info IS 'Información laboral del solicitante (JSON)';


--
-- Name: COLUMN certifications.income_proof_path; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.certifications.income_proof_path IS 'Ruta al archivo de prueba de ingresos';


--
-- Name: COLUMN certifications.financial_info; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.certifications.financial_info IS 'Información financiera del solicitante (JSON)';


--
-- Name: certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.certifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certifications_id_seq OWNER TO agro_admin;

--
-- Name: certifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.certifications_id_seq OWNED BY public.certifications.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer,
    lote_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO agro_admin;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO agro_admin;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: lotes; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.lotes (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    seller_id integer,
    location character varying(255) NOT NULL,
    province character varying(100),
    city character varying(100),
    animal_type character varying(50) NOT NULL,
    male_count integer DEFAULT 0,
    female_count integer DEFAULT 0,
    total_count integer NOT NULL,
    average_weight numeric(10,2) NOT NULL,
    breed character varying(100),
    base_price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'ARS'::character varying,
    feeding_type character varying(100),
    video_url text,
    photos text[],
    description text,
    status character varying(20) DEFAULT 'ofertado'::character varying,
    health_certificate boolean DEFAULT false,
    vaccination_records boolean DEFAULT false,
    additional_data jsonb DEFAULT '{}'::jsonb,
    views_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    featured_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '30 days'::interval),
    uniformity character varying(50) DEFAULT 'uniformidad_media'::character varying,
    CONSTRAINT lotes_status_check CHECK (((status)::text = ANY ((ARRAY['ofertado'::character varying, 'completo'::character varying, 'cancelado'::character varying, 'pendiente_aprobacion'::character varying])::text[])))
);


ALTER TABLE public.lotes OWNER TO agro_admin;

--
-- Name: lote_stats; Type: VIEW; Schema: public; Owner: agro_admin
--

CREATE VIEW public.lote_stats AS
 SELECT status,
    count(*) AS total_lotes,
    sum(total_count) AS total_animals,
    sum(((total_count)::numeric * average_weight)) AS total_weight_kg,
    avg(base_price) AS avg_price_per_kg,
    min(base_price) AS min_price_per_kg,
    max(base_price) AS max_price_per_kg
   FROM public.lotes l
  GROUP BY status;


ALTER VIEW public.lote_stats OWNER TO agro_admin;

--
-- Name: lotes_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.lotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_id_seq OWNER TO agro_admin;

--
-- Name: lotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.lotes_id_seq OWNED BY public.lotes.id;


--
-- Name: market_prices; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.market_prices (
    id integer NOT NULL,
    category character varying(100) NOT NULL,
    min_price numeric(10,2),
    max_price numeric(10,2),
    avg_price numeric(10,2),
    trend character varying(20),
    change_percentage numeric(5,2),
    source character varying(100),
    effective_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT market_prices_trend_check CHECK (((trend)::text = ANY ((ARRAY['up'::character varying, 'down'::character varying, 'stable'::character varying])::text[])))
);


ALTER TABLE public.market_prices OWNER TO agro_admin;

--
-- Name: market_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.market_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.market_prices_id_seq OWNER TO agro_admin;

--
-- Name: market_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.market_prices_id_seq OWNED BY public.market_prices.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    sender_id integer,
    receiver_id integer,
    subject character varying(255),
    body text,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    parent_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    transaction_id integer,
    message_text text
);


ALTER TABLE public.messages OWNER TO agro_admin;

--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON TABLE public.messages IS 'Private chat messages between buyer and seller for a specific transaction';


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO agro_admin;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO agro_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO agro_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: offers; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.offers (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    buyer_id integer,
    seller_id integer,
    lote_id integer,
    offered_price numeric(10,2) NOT NULL,
    original_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pendiente'::character varying,
    message text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_term character varying(50) DEFAULT 'contado'::character varying,
    payment_method character varying(50),
    counter_offer_price numeric(10,2),
    is_counter_offer boolean DEFAULT false,
    parent_offer_id integer,
    has_buyer_certification boolean DEFAULT false,
    payment_method_id integer,
    CONSTRAINT offers_status_check CHECK (((status)::text = ANY ((ARRAY['pendiente'::character varying, 'aceptada'::character varying, 'rechazada'::character varying, 'expirada'::character varying, 'cancelada'::character varying])::text[])))
);


ALTER TABLE public.offers OWNER TO agro_admin;

--
-- Name: COLUMN offers.payment_term; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.payment_term IS 'Payment term: contado, 30, 30-60, custom';


--
-- Name: COLUMN offers.payment_method; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.payment_method IS 'Payment method: transferencia, tarjeta, cheque';


--
-- Name: COLUMN offers.counter_offer_price; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.counter_offer_price IS 'Counter offer price from seller';


--
-- Name: COLUMN offers.is_counter_offer; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.is_counter_offer IS 'True if this is a counter offer from seller';


--
-- Name: COLUMN offers.parent_offer_id; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.parent_offer_id IS 'Reference to the original offer if this is a counter offer';


--
-- Name: COLUMN offers.payment_method_id; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.offers.payment_method_id IS 'Reference to the buyer payment method selected for this offer';


--
-- Name: offers_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offers_id_seq OWNER TO agro_admin;

--
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    lote_id integer,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO agro_admin;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO agro_admin;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    payment_type character varying(50) NOT NULL,
    bank_name character varying(100),
    account_holder_name character varying(200),
    account_number character varying(50),
    cbu character varying(22),
    alias_cbu character varying(50),
    account_type character varying(50),
    card_holder_name character varying(200),
    card_number_last4 character varying(4),
    card_brand character varying(50),
    card_expiry_month integer,
    card_expiry_year integer,
    check_issuer_name character varying(200),
    check_bank_name character varying(100),
    check_account_number character varying(50),
    is_default boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp without time zone,
    bank_id integer
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: TABLE payment_methods; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_methods IS 'Payment methods registered by buyers';


--
-- Name: COLUMN payment_methods.payment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_methods.payment_type IS 'bank_transfer, credit_card, check';


--
-- Name: COLUMN payment_methods.card_number_last4; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_methods.card_number_last4 IS 'Only last 4 digits for security';


--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_orders (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_term character varying(50) NOT NULL,
    payment_method character varying(50) NOT NULL,
    platform_commission numeric(10,2) NOT NULL,
    bank_commission numeric(10,2) NOT NULL,
    seller_net_amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    bank_reference character varying(255),
    bank_api_response text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    payment_method_id integer,
    seller_bank_account_id integer,
    bank_id integer,
    order_type character varying(20) DEFAULT 'final'::character varying,
    base_amount numeric(10,2),
    iva_amount numeric(10,2),
    due_date timestamp without time zone,
    negotiation_date timestamp without time zone
);


ALTER TABLE public.payment_orders OWNER TO postgres;

--
-- Name: TABLE payment_orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_orders IS 'Payment orders sent to bank for processing';


--
-- Name: COLUMN payment_orders.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.status IS 'pending, processing, completed, failed, refunded';


--
-- Name: COLUMN payment_orders.bank_api_response; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.bank_api_response IS 'JSON response from bank API for integration';


--
-- Name: COLUMN payment_orders.payment_method_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.payment_method_id IS 'Reference to the buyer payment method used for this payment';


--
-- Name: COLUMN payment_orders.seller_bank_account_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.seller_bank_account_id IS 'Reference to the seller bank account to receive payment';


--
-- Name: COLUMN payment_orders.order_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.order_type IS 'provisional: 85% advance payment, final: full payment with IVA';


--
-- Name: COLUMN payment_orders.base_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.base_amount IS 'Base amount before IVA (only for final orders)';


--
-- Name: COLUMN payment_orders.iva_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.iva_amount IS 'IVA amount 10.5% (only for final orders)';


--
-- Name: COLUMN payment_orders.due_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.due_date IS 'Payment due date based on negotiation_date + payment_term';


--
-- Name: COLUMN payment_orders.negotiation_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_orders.negotiation_date IS 'Reference to when seller accepted offer';


--
-- Name: payment_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_orders_id_seq OWNER TO postgres;

--
-- Name: payment_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_orders_id_seq OWNED BY public.payment_orders.id;


--
-- Name: pending_certifications_by_bank; Type: VIEW; Schema: public; Owner: agro_admin
--

CREATE VIEW public.pending_certifications_by_bank AS
 SELECT bank_name,
    count(*) AS pending_count,
    sum(approved_amount) AS total_requested_amount,
    min(created_at) AS oldest_request,
    max(created_at) AS newest_request
   FROM public.certifications c
  WHERE ((status)::text = 'pendiente'::text)
  GROUP BY bank_name;


ALTER VIEW public.pending_certifications_by_bank OWNER TO agro_admin;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: agro_user
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    buyer_id integer NOT NULL,
    question_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_blocked boolean DEFAULT false,
    CONSTRAINT check_question_text_length CHECK ((char_length(question_text) <= 1000))
);


ALTER TABLE public.questions OWNER TO agro_user;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_user
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO agro_user;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_user
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: seller_bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_bank_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    bank_name character varying(100) NOT NULL,
    account_holder_name character varying(200) NOT NULL,
    account_number character varying(50) NOT NULL,
    cbu character varying(22) NOT NULL,
    alias_cbu character varying(50),
    account_type character varying(50) NOT NULL,
    branch_number character varying(20),
    swift_code character varying(20),
    is_default boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp without time zone
);


ALTER TABLE public.seller_bank_accounts OWNER TO postgres;

--
-- Name: TABLE seller_bank_accounts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.seller_bank_accounts IS 'Bank accounts for sellers to receive payments';


--
-- Name: COLUMN seller_bank_accounts.cbu; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.seller_bank_accounts.cbu IS 'Clave Bancaria Uniforme - Required for Argentine transfers';


--
-- Name: seller_bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seller_bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seller_bank_accounts_id_seq OWNER TO postgres;

--
-- Name: seller_bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seller_bank_accounts_id_seq OWNED BY public.seller_bank_accounts.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO agro_admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO agro_admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    seller_id integer,
    buyer_id integer,
    lote_id integer,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    animal_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pendiente'::character varying,
    payment_method character varying(50),
    payment_status character varying(50) DEFAULT 'pendiente'::character varying,
    location character varying(255),
    average_weight numeric(10,2),
    breed character varying(100),
    commission numeric(10,2) DEFAULT 0,
    commission_paid boolean DEFAULT false,
    notes text,
    additional_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    agreed_price_per_kg numeric(10,2),
    estimated_weight numeric(10,2),
    estimated_total numeric(10,2),
    actual_weight numeric(10,2),
    balance_ticket_url character varying(500),
    final_amount numeric(10,2),
    platform_commission numeric(10,2),
    bank_commission numeric(10,2),
    seller_net_amount numeric(10,2),
    buyer_confirmed_weight boolean DEFAULT false,
    weight_updated_at timestamp without time zone,
    buyer_confirmed_at timestamp without time zone,
    offer_id integer,
    total_count integer,
    negotiation_date timestamp without time zone,
    payment_term character varying(50),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pendiente'::character varying, 'pending_weight'::character varying, 'weight_confirmed'::character varying, 'payment_pending'::character varying, 'payment_processing'::character varying, 'completed'::character varying, 'aprobado'::character varying, 'completo'::character varying, 'cancelado'::character varying, 'en_proceso'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO agro_admin;

--
-- Name: TABLE transactions; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON TABLE public.transactions IS 'Manages the complete purchase transaction flow including weight confirmation and payment';


--
-- Name: COLUMN transactions.status; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.transactions.status IS 'pending_weight, weight_confirmed, payment_pending, payment_processing, completed, cancelled';


--
-- Name: COLUMN transactions.negotiation_date; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.transactions.negotiation_date IS 'Date when seller accepted the offer (start of payment term calculation)';


--
-- Name: COLUMN transactions.payment_term; Type: COMMENT; Schema: public; Owner: agro_admin
--

COMMENT ON COLUMN public.transactions.payment_term IS 'Payment term: contado, 30_dias, 60_dias, 90_dias';


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO agro_admin;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.uploaded_files (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    user_id integer,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100),
    size bigint,
    path character varying(500) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.uploaded_files OWNER TO agro_admin;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.uploaded_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uploaded_files_id_seq OWNER TO agro_admin;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.uploaded_files_id_seq OWNED BY public.uploaded_files.id;


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.user_activity (
    id integer NOT NULL,
    user_id integer NOT NULL,
    activity_type character varying(100),
    description text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_activity OWNER TO agro_admin;

--
-- Name: user_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.user_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_activity_id_seq OWNER TO agro_admin;

--
-- Name: user_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.user_activity_id_seq OWNED BY public.user_activity.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: agro_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    user_type character varying(20) NOT NULL,
    phone character varying(20),
    location character varying(255),
    profile_data jsonb DEFAULT '{}'::jsonb,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    reset_token character varying(255),
    reset_token_expires timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    buyer_status character varying(50),
    bank_name character varying(100),
    dni character varying(20),
    cuit_cuil character varying(20),
    CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['comprador'::character varying, 'vendedor'::character varying, 'banco'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO agro_admin;

--
-- Name: user_stats; Type: VIEW; Schema: public; Owner: agro_admin
--

CREATE VIEW public.user_stats AS
 SELECT user_type,
    count(*) AS total_users,
    count(
        CASE
            WHEN is_active THEN 1
            ELSE NULL::integer
        END) AS active_users,
    count(
        CASE
            WHEN email_verified THEN 1
            ELSE NULL::integer
        END) AS verified_users,
    min(created_at) AS first_signup,
    max(created_at) AS last_signup,
    (avg((EXTRACT(epoch FROM (CURRENT_TIMESTAMP - (created_at)::timestamp with time zone)) / (86400)::numeric)))::integer AS avg_days_since_signup
   FROM public.users
  GROUP BY user_type;


ALTER VIEW public.user_stats OWNER TO agro_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: agro_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO agro_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agro_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_logs (
    id integer NOT NULL,
    bank_integration_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    response_status integer,
    response_body text,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.webhook_logs OWNER TO postgres;

--
-- Name: TABLE webhook_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.webhook_logs IS 'Registro de notificaciones webhook enviadas a bancos';


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhook_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_logs_id_seq OWNER TO postgres;

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhook_logs_id_seq OWNED BY public.webhook_logs.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- Name: bank_integrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations ALTER COLUMN id SET DEFAULT nextval('public.bank_integrations_id_seq'::regclass);


--
-- Name: certifications id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.certifications ALTER COLUMN id SET DEFAULT nextval('public.certifications_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: lotes id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.lotes ALTER COLUMN id SET DEFAULT nextval('public.lotes_id_seq'::regclass);


--
-- Name: market_prices id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.market_prices ALTER COLUMN id SET DEFAULT nextval('public.market_prices_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: offers id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: payment_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders ALTER COLUMN id SET DEFAULT nextval('public.payment_orders_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: seller_bank_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.seller_bank_accounts_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: uploaded_files id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.uploaded_files ALTER COLUMN id SET DEFAULT nextval('public.uploaded_files_id_seq'::regclass);


--
-- Name: user_activity id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.user_activity ALTER COLUMN id SET DEFAULT nextval('public.user_activity_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: webhook_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs ALTER COLUMN id SET DEFAULT nextval('public.webhook_logs_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: agro_user
--

COPY public.answers (id, question_id, seller_id, answer_text, created_at, is_blocked) FROM stdin;
\.


--
-- Data for Name: bank_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_integrations (id, bank_id, api_key, api_secret, webhook_url, webhook_secret, is_active, last_used_at, created_at, updated_at) FROM stdin;
1	4	agro_31fef8136373eeca955e8f606db5d614b892149fa6b17379	3b11d56b4165da6a3e61acc63d0667cfc441a2be3c97aec755881edac278172a4822c675c5f5a94a24cd2ce2bb913392	\N	\N	t	\N	2026-01-23 11:04:45.31104	2026-01-23 11:04:45.31104
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.certifications (id, uuid, user_id, bank_name, status, notes, reviewed_by, reviewed_at, approved_amount, interest_rate, term_months, expires_at, created_at, updated_at, personal_info, employment_info, income_proof_path, buyer_status, financial_info) FROM stdin;
1	0958b799-2715-446a-84a8-601c0584ab20	2	Banco Galicia	aprobado	\N	4	2026-01-13 11:02:57.298466	\N	\N	\N	\N	2026-01-12 12:44:51.097608	2026-01-13 11:02:57.298466	{"dni": "40541285", "last_name": "Boubee", "birth_date": "1997-08-21", "first_name": "Felipe", "nationality": "Argentina", "second_name": ""}	{"position": "", "employer_name": "Test", "monthly_income": "1500000", "years_employed": "", "employment_status": "empleado"}	/uploads/certifications/income-proof-2-1768232687437.png	pendiente_aprobacion	{"assets": "50000000", "liabilities": "2000000", "monthly_expenses": ""}
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.favorites (id, user_id, lote_id, created_at) FROM stdin;
1	2	1	2026-01-15 15:17:21.217423
\.


--
-- Data for Name: lotes; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.lotes (id, uuid, seller_id, location, province, city, animal_type, male_count, female_count, total_count, average_weight, breed, base_price, currency, feeding_type, video_url, photos, description, status, health_certificate, vaccination_records, additional_data, views_count, is_featured, featured_until, created_at, updated_at, expires_at, uniformity) FROM stdin;
1	e36e3557-9d9c-4d91-be4d-e7ff89673f25	3	Leontina, AA	Buenos Aires	AA	Terneros	1	1	2	180.00	Angus	5200.00	ARS	engorde		{/uploads/photos-1768172082589-695419878.jpeg}	A	completo	f	f	{}	0	f	\N	2026-01-10 17:24:26.582783	2026-01-23 14:33:15.829933	2026-02-09 17:24:26.582783	uniformidad_media
\.


--
-- Data for Name: market_prices; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.market_prices (id, category, min_price, max_price, avg_price, trend, change_percentage, source, effective_date, created_at) FROM stdin;
1	Novillitos	4850.00	5200.00	5025.00	up	2.30	\N	2026-01-10	2026-01-10 15:25:19.439443
2	Vaquillonas	4500.00	4800.00	4650.00	down	-1.50	\N	2026-01-10	2026-01-10 15:25:19.439443
3	Vacas	4200.00	4500.00	4350.00	up	0.80	\N	2026-01-10	2026-01-10 15:25:19.439443
4	Toros	5100.00	5500.00	5300.00	stable	0.00	\N	2026-01-10	2026-01-10 15:25:19.439443
5	Terneros	3800.00	4100.00	3950.00	up	1.20	\N	2026-01-10	2026-01-10 15:25:19.439443
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.messages (id, uuid, sender_id, receiver_id, subject, body, is_read, read_at, parent_id, created_at, transaction_id, message_text) FROM stdin;
4	3545a6f6-6b04-4b57-bd8a-7751a9426a17	3	2	\N	\N	t	\N	\N	2026-01-23 16:17:55.909875	7	test
5	8a0ec32b-96aa-4d18-96c9-00c288f284bb	3	2	\N	\N	t	\N	\N	2026-01-27 09:08:48.510432	7	test 2
6	e62abae6-74a0-4fc7-8bc4-efe3b3f73244	2	3	\N	\N	f	\N	\N	2026-01-27 09:31:41.920363	7	test back
7	ecf91618-2f77-4530-9ff7-39f86fba8e07	2	3	\N	\N	f	\N	\N	2026-01-27 09:31:58.459038	7	felipeboubee@gmail.com
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, created_at, read_at) FROM stdin;
1	2	certification_update	Actualización de certificación	¡Felicidades! Tu certificación con Banco Galicia ha sido aprobada.	{"status": "aprobado", "certification_id": "1"}	f	2026-01-12 21:11:18.05719	\N
2	2	certification_update	Actualización de certificación		{"status": "pendiente_aprobacion", "certification_id": "1"}	f	2026-01-13 10:15:32.481323	\N
3	2	certification_update	Actualización de certificación	Tu solicitud de certificación con Banco Galicia ha sido rechazada. Podrás volver a solicitar en 30 días.	{"status": "rechazado", "certification_id": "1"}	f	2026-01-13 10:16:35.898018	\N
4	2	certification_update	Actualización de certificación		{"status": "pendiente_aprobacion", "certification_id": "1"}	f	2026-01-13 10:19:02.598615	\N
5	2	certification_update	Actualización de certificación	Banco Galicia requiere más información para procesar tu certificación. Por favor, completa los datos adicionales.	{"status": "mas_datos", "certification_id": "1"}	f	2026-01-13 10:19:13.866667	\N
6	2	certification_update	Actualización de certificación	Banco Galicia requiere más información para procesar tu certificación. Por favor, completa los datos adicionales.	{"status": "mas_datos", "certification_id": "1"}	f	2026-01-13 10:53:55.10429	\N
7	2	certification_update	Actualización de certificación	¡Felicidades! Tu certificación con Banco Galicia ha sido aprobada.	{"status": "aprobado", "certification_id": "1"}	f	2026-01-13 11:02:57.393978	\N
8	2	final_payment_approved	Orden de pago final aprobada	El banco aprobó el pago final por $1778400.00.	{"transaction_id": 7}	f	2026-01-23 12:00:44.627823	\N
9	3	final_payment_approved	Orden de pago final aprobada	El banco aprobó el pago final por $1778400.00. El dinero está en camino.	{"transaction_id": 7}	f	2026-01-23 12:00:44.759472	\N
10	3	transaction_completed	Transacción completada	La transacción por $1778400.00 se ha completado exitosamente.	{"transaction_id": 7}	f	2026-01-23 12:00:44.762831	\N
11	2	transaction_completed	Transacción completada	La transacción por $1778400.00 se ha completado exitosamente.	{"transaction_id": 7}	f	2026-01-23 12:00:44.766408	\N
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.offers (id, uuid, buyer_id, seller_id, lote_id, offered_price, original_price, status, message, expires_at, created_at, updated_at, payment_term, payment_method, counter_offer_price, is_counter_offer, parent_offer_id, has_buyer_certification, payment_method_id) FROM stdin;
6	a7879ab7-0dfe-4076-bff4-6f8640476611	2	3	1	4680.00	5200.00	aceptada	\N	\N	2026-01-20 18:20:23.474717	2026-01-20 18:20:37.342127	contado	transferencia	\N	f	\N	t	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.orders (id, user_id, lote_id, status, total_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, user_id, payment_type, bank_name, account_holder_name, account_number, cbu, alias_cbu, account_type, card_holder_name, card_number_last4, card_brand, card_expiry_month, card_expiry_year, check_issuer_name, check_bank_name, check_account_number, is_default, is_verified, status, created_at, updated_at, verified_at, bank_id) FROM stdin;
1	2	credit_card	\N	\N	\N	\N	\N	\N	Felipe Boubee	8438	visa	\N	\N	\N	\N	\N	f	f	inactive	2026-01-27 09:42:45.301997	2026-01-27 10:38:02.908623	\N	11
2	2	bank_transfer	Banco Galicia	Felipe Boubee	4105279-9 999-7	0070999030004105279973	felipeboubee	caja_ahorro	\N	\N	\N	\N	\N	\N	\N	\N	t	t	active	2026-01-27 09:43:56.116273	2026-01-27 10:38:07.93432	2026-01-27 10:38:07.93432	11
3	2	check	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Felipe Boubee	Banco Galicia	4105279-9 999-7	f	t	active	2026-01-27 09:44:24.602035	2026-01-27 10:38:11.940319	2026-01-27 10:38:11.940319	11
4	2	credit_card	\N	\N	\N	\N	\N	\N	Felipe Boubee	8438	visa	\N	\N	\N	\N	\N	f	f	inactive	2026-01-27 10:39:41.658072	2026-01-27 11:42:26.423971	\N	11
5	2	credit_card	\N	\N	\N	\N	\N	\N	Felipe Boubee	8438	visa	11	2030	\N	\N	\N	f	t	active	2026-01-27 11:43:28.987756	2026-01-27 11:43:42.901197	2026-01-27 11:43:42.901197	11
\.


--
-- Data for Name: payment_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_orders (id, transaction_id, buyer_id, seller_id, amount, payment_term, payment_method, platform_commission, bank_commission, seller_net_amount, status, bank_reference, bank_api_response, created_at, processed_at, completed_at, payment_method_id, seller_bank_account_id, bank_id, order_type, base_amount, iva_amount, due_date, negotiation_date) FROM stdin;
2	7	2	3	1778400.00	contado	transferencia	17784.00	35568.00	1725048.00	completed	BK-1769180405932-4702	"{\\"status\\":\\"success\\",\\"transaction_id\\":\\"TX-1769180444190\\"}"	2026-01-21 14:47:30.785219	2026-01-23 12:00:06.259301	2026-01-23 12:00:44.309085	\N	\N	4	final	\N	\N	\N	\N
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: agro_user
--

COPY public.questions (id, lote_id, buyer_id, question_text, created_at, is_blocked) FROM stdin;
1	1	2	Test	2026-01-15 14:51:07.271943	f
\.


--
-- Data for Name: seller_bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_bank_accounts (id, user_id, bank_name, account_holder_name, account_number, cbu, alias_cbu, account_type, branch_number, swift_code, is_default, is_verified, status, created_at, updated_at, verified_at) FROM stdin;
1	3	Banco Galicia	Felipe Boubee	4105279-9 999-7	0070999030004105279973	felipeboubee	caja_ahorro	\N	\N	t	t	active	2026-01-27 09:28:58.97931	2026-01-27 09:30:19.815934	2026-01-27 09:30:19.815934
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.system_settings (id, key, value, description, created_at, updated_at) FROM stdin;
1	available_banks	["Banco Galicia", "Banco Nación", "Banco Provincia", "Banco Santander", "Banco BBVA", "Banco Patagonia", "Banco Macro", "Banco Comafi", "Banco Credicoop"]	Lista de bancos disponibles para certificación	2026-01-10 15:25:19.43808	2026-01-10 15:25:19.43808
2	commission_rate	{"vip": 1.5, "default": 2.5}	Porcentaje de comisión por transacción	2026-01-10 15:25:19.43808	2026-01-10 15:25:19.43808
3	platform_settings	{"currency": "ARS", "timezone": "America/Argentina/Buenos_Aires", "lote_expiry_days": 30}	Configuración general de la plataforma	2026-01-10 15:25:19.43808	2026-01-10 15:25:19.43808
4	email_settings	{"smtp_host": "smtp.gmail.com", "smtp_port": 587, "from_email": "no-reply@agromarket.com"}	Configuración de email	2026-01-10 15:25:19.43808	2026-01-10 15:25:19.43808
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.transactions (id, uuid, seller_id, buyer_id, lote_id, price, quantity, animal_type, status, payment_method, payment_status, location, average_weight, breed, commission, commission_paid, notes, additional_data, created_at, updated_at, completed_at, agreed_price_per_kg, estimated_weight, estimated_total, actual_weight, balance_ticket_url, final_amount, platform_commission, bank_commission, seller_net_amount, buyer_confirmed_weight, weight_updated_at, buyer_confirmed_at, offer_id, total_count, negotiation_date, payment_term) FROM stdin;
7	7c34bf37-2a55-47b2-829c-1f929be01b46	3	2	1	4680.00	2	Terneros	completed	\N	pendiente	\N	\N	\N	0.00	f	\N	{}	2026-01-20 18:20:37.948061	2026-01-23 12:00:44.314037	\N	4680.00	360.00	1684800.00	380.00	/uploads/balance-tickets/balance-ticket-1769003953103-864130834.png	1778400.00	17784.00	35568.00	1725048.00	t	2026-01-21 10:59:14.925958	2026-01-21 11:35:13.88999	6	\N	\N	\N
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.uploaded_files (id, uuid, user_id, filename, original_name, mime_type, size, path, entity_type, entity_id, is_public, created_at) FROM stdin;
\.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.user_activity (id, user_id, activity_type, description, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: agro_admin
--

COPY public.users (id, uuid, email, password, name, user_type, phone, location, profile_data, last_login, is_active, email_verified, verification_token, reset_token, reset_token_expires, created_at, updated_at, buyer_status, bank_name, dni, cuit_cuil) FROM stdin;
1	d89269ce-8fd2-4962-ae7f-5232d056bfd8	admin@agromarket.com	$2b$10$mmF.7s/MdfUNwa18PsJItOjhMaxQiip53kynFP5DYeY00oDl2nkBu	Administrador del Sistema	admin	+54 11 1234-5678	Buenos Aires, Argentina	{}	\N	t	t	\N	\N	\N	2026-01-10 15:25:19.436201	2026-01-10 15:25:19.436201	\N	\N	\N	\N
3	1b3da6df-a9c1-44a1-bf1c-5113b30492cd	vendedor@ejemplo.com	$2b$10$wwOdemKfKB8LgDnDgRvqe.L6qXgzpPTHlgZQvlenwHhmEO/yieeUy	Vendedor User	vendedor	\N	\N	{}	\N	t	t	\N	\N	\N	2026-01-10 15:44:01.078265	2026-01-10 15:44:01.078265	\N	\N	\N	\N
2	42fd54cc-f562-4442-b5e2-dafa30512b7b	comprador@ejemplo.com	$2b$10$wwOdemKfKB8LgDnDgRvqe.L6qXgzpPTHlgZQvlenwHhmEO/yieeUy	Comprador User	comprador	\N	\N	{}	\N	t	t	\N	\N	\N	2026-01-10 15:44:01.078265	2026-01-12 12:44:52.231161	pendiente_aprobacion	\N	\N	\N
7	11608ad6-d7bb-4d60-942d-c7383358875e	felipeboubee@gmail.com	$2b$10$GnzSFHrROWoyrGmWpiee5O4qugl.n9zpwSuqMbQyfknToXcXMVp2m	Felipe Boubee	comprador	+541122661568	Buenos Aires, Buenos Aires, Argentina	{}	\N	t	f	\N	\N	\N	2026-01-15 10:35:23.509174	2026-01-15 10:35:23.509174	\N	\N	40541285	20-40541285-4
8	adce5761-d834-4170-a17c-654b2e5ee518	felipeboubee@gmail.com	$2b$10$aDXmUkk8P7fr6PUUCfNsQeTtnZSJtRYkgAVRCkg/VR/ke/U00KoGu	Felipe Boubee	vendedor	+541122661568	Buenos Aires, Buenos Aires, Argentina	{}	\N	t	f	\N	\N	\N	2026-01-15 10:35:23.952074	2026-01-15 10:35:23.952074	\N	\N	40541285	20-40541285-4
9	d093c08a-5f61-4e7b-906f-6385fe8f558c	banco.nacion@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Nación	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Nación	\N	\N
10	a0142daf-11a5-44e7-b167-704a50da9d48	banco.provincia@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Provincia	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Provincia	\N	\N
11	8b3a44a8-ef3d-474e-af7d-c072f63aad4b	banco.galicia@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Galicia	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Galicia	\N	\N
12	05742ca3-0773-49d0-a1a8-25d2f99bde50	banco.santander@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Santander	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Santander	\N	\N
13	df0aeb8d-daf9-41c3-bd8d-fd707b7967ea	banco.bbva@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco BBVA	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco BBVA	\N	\N
14	1fb047f2-1117-454a-acab-53c47010cc02	banco.macro@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Macro	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Macro	\N	\N
15	b4d1e280-f033-4253-a457-cc2e64ad3407	banco.icbc@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco ICBC	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco ICBC	\N	\N
16	53f49ab4-64e0-410f-b320-6826f04b4f5c	banco.patagonia@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Patagonia	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Patagonia	\N	\N
17	280d0b03-ce77-483b-bc41-7b4d901f8c58	banco.supervielle@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Supervielle	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Supervielle	\N	\N
18	75f42ce7-b9be-4a80-a90e-9ea91b553b9f	banco.credicoop@agromarket.com	$2b$10$tePowxZC2f.nvbZSLiBROejV4H8H8VnfSV3Kbl4sbuXOJeG/4SAC.	Banco Credicoop	banco	\N	\N	{}	\N	t	f	\N	\N	\N	2026-01-21 12:24:08.253945	2026-01-22 17:21:34.331852	\N	Banco Credicoop	\N	\N
4	6c07e924-f6db-4ee1-a8d3-2735998e5c1b	banco@ejemplo.com	$2b$10$wwOdemKfKB8LgDnDgRvqe.L6qXgzpPTHlgZQvlenwHhmEO/yieeUy	Banco User	banco	+541112345455	\N	{}	\N	t	t	\N	\N	\N	2026-01-10 15:44:01.078265	2026-01-22 18:38:44.307351	\N	Banco Galicia	\N	\N
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_logs (id, bank_integration_id, event_type, payload, response_status, response_body, error_message, created_at) FROM stdin;
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_user
--

SELECT pg_catalog.setval('public.answers_id_seq', 1, false);


--
-- Name: bank_integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_integrations_id_seq', 1, true);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.certifications_id_seq', 1, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, true);


--
-- Name: lotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.lotes_id_seq', 1, true);


--
-- Name: market_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.market_prices_id_seq', 5, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.messages_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 11, true);


--
-- Name: offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.offers_id_seq', 6, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 5, true);


--
-- Name: payment_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_orders_id_seq', 2, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_user
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, true);


--
-- Name: seller_bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seller_bank_accounts_id_seq', 1, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 4, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.transactions_id_seq', 7, true);


--
-- Name: uploaded_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.uploaded_files_id_seq', 1, false);


--
-- Name: user_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.user_activity_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agro_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhook_logs_id_seq', 1, false);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: bank_integrations bank_integrations_api_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT bank_integrations_api_key_key UNIQUE (api_key);


--
-- Name: bank_integrations bank_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT bank_integrations_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_lote_id_key; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_lote_id_key UNIQUE (user_id, lote_id);


--
-- Name: lotes lotes_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_pkey PRIMARY KEY (id);


--
-- Name: market_prices market_prices_category_effective_date_key; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.market_prices
    ADD CONSTRAINT market_prices_category_effective_date_key UNIQUE (category, effective_date);


--
-- Name: market_prices market_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.market_prices
    ADD CONSTRAINT market_prices_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_orders payment_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: seller_bank_accounts seller_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_bank_accounts
    ADD CONSTRAINT seller_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: uploaded_files uploaded_files_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: users users_email_user_type_key; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_user_type_key UNIQUE (email, user_type);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_action; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_activity_action ON public.activity_logs USING btree (action);


--
-- Name: idx_activity_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_activity_created ON public.activity_logs USING btree (created_at);


--
-- Name: idx_activity_user; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_activity_user ON public.activity_logs USING btree (user_id);


--
-- Name: idx_answers_created_at; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_answers_created_at ON public.answers USING btree (created_at DESC);


--
-- Name: idx_answers_question_id; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_answers_question_id ON public.answers USING btree (question_id);


--
-- Name: idx_answers_seller_id; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_answers_seller_id ON public.answers USING btree (seller_id);


--
-- Name: idx_bank_integrations_api_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_integrations_api_key ON public.bank_integrations USING btree (api_key);


--
-- Name: idx_bank_integrations_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_integrations_bank_id ON public.bank_integrations USING btree (bank_id);


--
-- Name: idx_certifications_bank; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_bank ON public.certifications USING btree (bank_name);


--
-- Name: idx_certifications_bank_name; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_bank_name ON public.certifications USING btree (bank_name);


--
-- Name: idx_certifications_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_created ON public.certifications USING btree (created_at);


--
-- Name: idx_certifications_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_status ON public.certifications USING btree (status);


--
-- Name: idx_certifications_user; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_user ON public.certifications USING btree (user_id);


--
-- Name: idx_certifications_user_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_certifications_user_id ON public.certifications USING btree (user_id);


--
-- Name: idx_favorites_lote; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_favorites_lote ON public.favorites USING btree (lote_id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_lotes_animal_type; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_animal_type ON public.lotes USING btree (animal_type);


--
-- Name: idx_lotes_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_created ON public.lotes USING btree (created_at);


--
-- Name: idx_lotes_expires; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_expires ON public.lotes USING btree (expires_at);


--
-- Name: idx_lotes_location; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_location ON public.lotes USING btree (location);


--
-- Name: idx_lotes_price; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_price ON public.lotes USING btree (base_price);


--
-- Name: idx_lotes_province; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_province ON public.lotes USING btree (province);


--
-- Name: idx_lotes_seller; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_seller ON public.lotes USING btree (seller_id);


--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_lotes_status ON public.lotes USING btree (status);


--
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at);


--
-- Name: idx_messages_is_read; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read);


--
-- Name: idx_messages_read; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_read ON public.messages USING btree (is_read);


--
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_messages_transaction_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_messages_transaction_id ON public.messages USING btree (transaction_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_offers_buyer; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_offers_buyer ON public.offers USING btree (buyer_id);


--
-- Name: idx_offers_lote; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_offers_lote ON public.offers USING btree (lote_id);


--
-- Name: idx_offers_payment_method; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_offers_payment_method ON public.offers USING btree (payment_method_id);


--
-- Name: idx_offers_seller; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_offers_seller ON public.offers USING btree (seller_id);


--
-- Name: idx_offers_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_offers_status ON public.offers USING btree (status);


--
-- Name: idx_one_default_bank_account_per_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_one_default_bank_account_per_seller ON public.seller_bank_accounts USING btree (user_id) WHERE (is_default = true);


--
-- Name: idx_one_default_payment_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_one_default_payment_per_user ON public.payment_methods USING btree (user_id) WHERE (is_default = true);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_payment_methods_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_bank_id ON public.payment_methods USING btree (bank_id);


--
-- Name: idx_payment_methods_is_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_is_default ON public.payment_methods USING btree (is_default);


--
-- Name: idx_payment_methods_payment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_payment_type ON public.payment_methods USING btree (payment_type);


--
-- Name: idx_payment_methods_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods USING btree (user_id);


--
-- Name: idx_payment_orders_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_bank_id ON public.payment_orders USING btree (bank_id);


--
-- Name: idx_payment_orders_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_buyer_id ON public.payment_orders USING btree (buyer_id);


--
-- Name: idx_payment_orders_payment_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_payment_method ON public.payment_orders USING btree (payment_method_id);


--
-- Name: idx_payment_orders_seller_bank_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_seller_bank_account ON public.payment_orders USING btree (seller_bank_account_id);


--
-- Name: idx_payment_orders_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_seller_id ON public.payment_orders USING btree (seller_id);


--
-- Name: idx_payment_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_status ON public.payment_orders USING btree (status);


--
-- Name: idx_payment_orders_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_orders_transaction_id ON public.payment_orders USING btree (transaction_id);


--
-- Name: idx_questions_buyer_id; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_questions_buyer_id ON public.questions USING btree (buyer_id);


--
-- Name: idx_questions_created_at; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_questions_created_at ON public.questions USING btree (created_at DESC);


--
-- Name: idx_questions_lote_id; Type: INDEX; Schema: public; Owner: agro_user
--

CREATE INDEX idx_questions_lote_id ON public.questions USING btree (lote_id);


--
-- Name: idx_seller_bank_accounts_is_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_bank_accounts_is_default ON public.seller_bank_accounts USING btree (is_default);


--
-- Name: idx_seller_bank_accounts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_bank_accounts_status ON public.seller_bank_accounts USING btree (status);


--
-- Name: idx_seller_bank_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_bank_accounts_user_id ON public.seller_bank_accounts USING btree (user_id);


--
-- Name: idx_transactions_buyer; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_buyer ON public.transactions USING btree (buyer_id);


--
-- Name: idx_transactions_buyer_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_buyer_id ON public.transactions USING btree (buyer_id);


--
-- Name: idx_transactions_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_created ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_lote_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_lote_id ON public.transactions USING btree (lote_id);


--
-- Name: idx_transactions_payment_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_payment_status ON public.transactions USING btree (payment_status);


--
-- Name: idx_transactions_seller; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_seller ON public.transactions USING btree (seller_id);


--
-- Name: idx_transactions_seller_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_seller_id ON public.transactions USING btree (seller_id);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_user_activity_created_at; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_user_activity_created_at ON public.user_activity USING btree (created_at);


--
-- Name: idx_user_activity_type; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_user_activity_type ON public.user_activity USING btree (activity_type);


--
-- Name: idx_user_activity_user_id; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_user_activity_user_id ON public.user_activity USING btree (user_id);


--
-- Name: idx_users_created; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_users_created ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_users_status ON public.users USING btree (is_active);


--
-- Name: idx_users_type; Type: INDEX; Schema: public; Owner: agro_admin
--

CREATE INDEX idx_users_type ON public.users USING btree (user_type);


--
-- Name: idx_webhook_logs_bank_integration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_logs_bank_integration ON public.webhook_logs USING btree (bank_integration_id);


--
-- Name: idx_webhook_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs USING btree (created_at);


--
-- Name: certifications update_certifications_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lotes update_lotes_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: offers update_offers_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: agro_admin
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: answers answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: answers answers_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bank_integrations bank_integrations_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT bank_integrations_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: certifications certifications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: certifications certifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lotes lotes_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offers offers_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: offers offers_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id);


--
-- Name: offers offers_parent_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_parent_offer_id_fkey FOREIGN KEY (parent_offer_id) REFERENCES public.offers(id);


--
-- Name: offers offers_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: offers offers_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: orders orders_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_methods payment_methods_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.users(id);


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_orders payment_orders_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.users(id);


--
-- Name: payment_orders payment_orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: payment_orders payment_orders_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: payment_orders payment_orders_seller_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_seller_bank_account_id_fkey FOREIGN KEY (seller_bank_account_id) REFERENCES public.seller_bank_accounts(id);


--
-- Name: payment_orders payment_orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: payment_orders payment_orders_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: questions questions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id) ON DELETE CASCADE;


--
-- Name: seller_bank_accounts seller_bank_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_bank_accounts
    ADD CONSTRAINT seller_bank_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id);


--
-- Name: transactions transactions_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id);


--
-- Name: transactions transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: uploaded_files uploaded_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agro_admin
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: webhook_logs webhook_logs_bank_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_bank_integration_id_fkey FOREIGN KEY (bank_integration_id) REFERENCES public.bank_integrations(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO agro_admin;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1() TO agro_admin;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO agro_admin;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO agro_admin;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v4() TO agro_admin;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO agro_admin;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_nil() TO agro_admin;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_dns() TO agro_admin;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_oid() TO agro_admin;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_url() TO agro_admin;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_x500() TO agro_admin;


--
-- Name: TABLE bank_integrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bank_integrations TO agro_admin;


--
-- Name: SEQUENCE bank_integrations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.bank_integrations_id_seq TO agro_admin;


--
-- Name: TABLE payment_methods; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_methods TO agro_admin;


--
-- Name: SEQUENCE payment_methods_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payment_methods_id_seq TO agro_admin;


--
-- Name: TABLE payment_orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_orders TO agro_admin;


--
-- Name: SEQUENCE payment_orders_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payment_orders_id_seq TO agro_admin;


--
-- Name: TABLE seller_bank_accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seller_bank_accounts TO agro_admin;


--
-- Name: SEQUENCE seller_bank_accounts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.seller_bank_accounts_id_seq TO agro_admin;


--
-- Name: TABLE webhook_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.webhook_logs TO agro_admin;


--
-- Name: SEQUENCE webhook_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.webhook_logs_id_seq TO agro_admin;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO agro_admin;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO agro_admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO agro_admin;


--
-- PostgreSQL database dump complete
--

\unrestrict yx8jcJkddIn93GhdwPXUGf6iBkf9Vb21hBdgI2gTJijgASpp3QUdOoHrvMrF7Mf

