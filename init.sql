--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras (
    id integer NOT NULL,
    producto character varying(100) NOT NULL,
    cantidad integer NOT NULL,
    unidad character varying(50) NOT NULL,
    costo_unitario numeric(10,2) NOT NULL,
    costo_total numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * costo_unitario)) STORED,
    fecha date DEFAULT CURRENT_DATE,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.compras OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compras_id_seq OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;


--
-- Name: detalle_receta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_receta (
    id integer NOT NULL,
    receta_id integer,
    ingrediente_id integer,
    cantidad numeric(10,2) NOT NULL
);


ALTER TABLE public.detalle_receta OWNER TO postgres;

--
-- Name: detalle_receta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_receta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_receta_id_seq OWNER TO postgres;

--
-- Name: detalle_receta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_receta_id_seq OWNED BY public.detalle_receta.id;


--
-- Name: ingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredientes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(50) NOT NULL,
    costo numeric(10,4) NOT NULL,
    fecha_ingreso date,
    descripcion text
);


ALTER TABLE public.ingredientes OWNER TO postgres;

--
-- Name: ingredientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredientes_id_seq OWNER TO postgres;

--
-- Name: ingredientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredientes_id_seq OWNED BY public.ingredientes.id;


--
-- Name: ingredientes_receta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredientes_receta (
    id integer NOT NULL,
    receta_id integer NOT NULL,
    tipo_componente character varying(50) NOT NULL,
    nombre_componente character varying(255),
    subreceta_referencia_id integer,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(50),
    costo_unitario numeric(10,2),
    fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    materia_prima_id integer,
    costo_total_ingrediente numeric(10,4) DEFAULT 0.0000,
    CONSTRAINT ingredientes_receta_tipo_componente_check CHECK (((tipo_componente)::text = ANY ((ARRAY['ingrediente_base'::character varying, 'sub_receta'::character varying])::text[])))
);


ALTER TABLE public.ingredientes_receta OWNER TO postgres;

--
-- Name: ingredientes_receta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredientes_receta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredientes_receta_id_seq OWNER TO postgres;

--
-- Name: ingredientes_receta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredientes_receta_id_seq OWNED BY public.ingredientes_receta.id;


--
-- Name: metas_diarias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metas_diarias (
    id integer NOT NULL,
    fecha date NOT NULL,
    meta_venta_diaria numeric(10,2) NOT NULL,
    ventas_actuales numeric(10,2) DEFAULT 0,
    ganancia_neta_actual numeric(10,2) DEFAULT 0
);


ALTER TABLE public.metas_diarias OWNER TO postgres;

--
-- Name: metas_diarias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metas_diarias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metas_diarias_id_seq OWNER TO postgres;

--
-- Name: metas_diarias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metas_diarias_id_seq OWNED BY public.metas_diarias.id;


--
-- Name: pagos_diarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagos_diarios (
    id integer NOT NULL,
    tipo_pago character varying(100) NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo_pago character varying(100) NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    descripcion text,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pagos_diarios OWNER TO postgres;

--
-- Name: pagos_diarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pagos_diarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_diarios_id_seq OWNER TO postgres;

--
-- Name: pagos_diarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pagos_diarios_id_seq OWNED BY public.pagos_diarios.id;


--
-- Name: recetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recetas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL
);


ALTER TABLE public.recetas OWNER TO postgres;

--
-- Name: recetas_estandar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recetas_estandar (
    id integer NOT NULL,
    nombre_platillo character varying(255) NOT NULL,
    foto_url text,
    descripcion text,
    costo_total_calculado numeric(10,2) DEFAULT 0.00,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    precio_venta numeric(10,2) DEFAULT 0.00,
    es_producto_final boolean DEFAULT false,
    utilidad_bruta numeric(10,2) DEFAULT 0.00,
    porcentaje_utilidad numeric(10,2) DEFAULT 0.00
);


ALTER TABLE public.recetas_estandar OWNER TO postgres;

--
-- Name: recetas_estandar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recetas_estandar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recetas_estandar_id_seq OWNER TO postgres;

--
-- Name: recetas_estandar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recetas_estandar_id_seq OWNED BY public.recetas_estandar.id;


--
-- Name: recetas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recetas_id_seq OWNER TO postgres;

--
-- Name: recetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recetas_id_seq OWNED BY public.recetas.id;


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ventas (
    id integer NOT NULL,
    fecha date NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    receta_estandar_id integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    platillo_id integer,
    precio_unitario numeric(10,2),
    total_venta numeric(10,2),
    metodo_pago character varying(50),
    descripcion text
);


ALTER TABLE public.ventas OWNER TO postgres;

--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ventas_id_seq OWNER TO postgres;

--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- Name: compras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);


--
-- Name: detalle_receta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta ALTER COLUMN id SET DEFAULT nextval('public.detalle_receta_id_seq'::regclass);


--
-- Name: ingredientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes ALTER COLUMN id SET DEFAULT nextval('public.ingredientes_id_seq'::regclass);


--
-- Name: ingredientes_receta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes_receta ALTER COLUMN id SET DEFAULT nextval('public.ingredientes_receta_id_seq'::regclass);


--
-- Name: metas_diarias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_diarias ALTER COLUMN id SET DEFAULT nextval('public.metas_diarias_id_seq'::regclass);


--
-- Name: pagos_diarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_diarios ALTER COLUMN id SET DEFAULT nextval('public.pagos_diarios_id_seq'::regclass);


--
-- Name: recetas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas ALTER COLUMN id SET DEFAULT nextval('public.recetas_id_seq'::regclass);


--
-- Name: recetas_estandar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas_estandar ALTER COLUMN id SET DEFAULT nextval('public.recetas_estandar_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- Name: detalle_receta detalle_receta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_pkey PRIMARY KEY (id);


--
-- Name: ingredientes ingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id);


--
-- Name: ingredientes_receta ingredientes_receta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes_receta
    ADD CONSTRAINT ingredientes_receta_pkey PRIMARY KEY (id);


--
-- Name: metas_diarias metas_diarias_fecha_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_diarias
    ADD CONSTRAINT metas_diarias_fecha_key UNIQUE (fecha);


--
-- Name: metas_diarias metas_diarias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_diarias
    ADD CONSTRAINT metas_diarias_pkey PRIMARY KEY (id);


--
-- Name: pagos_diarios pagos_diarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos_diarios
    ADD CONSTRAINT pagos_diarios_pkey PRIMARY KEY (id);


--
-- Name: recetas_estandar recetas_estandar_nombre_platillo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas_estandar
    ADD CONSTRAINT recetas_estandar_nombre_platillo_key UNIQUE (nombre_platillo);


--
-- Name: recetas_estandar recetas_estandar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas_estandar
    ADD CONSTRAINT recetas_estandar_pkey PRIMARY KEY (id);


--
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: idx_fecha_ventas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fecha_ventas ON public.ventas USING btree (fecha);


--
-- Name: idx_nombre_ingredientes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nombre_ingredientes ON public.ingredientes USING btree (nombre);


--
-- Name: idx_nombre_recetas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nombre_recetas ON public.recetas USING btree (nombre);


--
-- Name: detalle_receta detalle_receta_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id) ON DELETE CASCADE;


--
-- Name: detalle_receta detalle_receta_receta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES public.recetas(id) ON DELETE CASCADE;


--
-- Name: ingredientes_receta fk_materia_prima_receta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes_receta
    ADD CONSTRAINT fk_materia_prima_receta FOREIGN KEY (materia_prima_id) REFERENCES public.ingredientes(id) ON DELETE CASCADE;


--
-- Name: ventas fk_venta_receta_estandar; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT fk_venta_receta_estandar FOREIGN KEY (receta_estandar_id) REFERENCES public.recetas_estandar(id) ON DELETE SET NULL;


--
-- Name: ingredientes_receta ingredientes_receta_receta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes_receta
    ADD CONSTRAINT ingredientes_receta_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES public.recetas_estandar(id) ON DELETE CASCADE;


--
-- Name: ingredientes_receta ingredientes_receta_subreceta_referencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes_receta
    ADD CONSTRAINT ingredientes_receta_subreceta_referencia_id_fkey FOREIGN KEY (subreceta_referencia_id) REFERENCES public.recetas_estandar(id) ON DELETE SET NULL;


--
-- Name: ventas ventas_platillo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_platillo_id_fkey FOREIGN KEY (platillo_id) REFERENCES public.recetas_estandar(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

