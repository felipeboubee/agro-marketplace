--
-- PostgreSQL database cluster dump
--

\restrict x2GzLtvQyhbtSwqZca7mfhud3PwsSlQQtf9wHW135ymyQ3OqDdbrte89SwNSPqI

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE agro_admin;
ALTER ROLE agro_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:BNuycnf0D+izy0tp5TANRA==$fhwT+9hvU1a6m6R8OfnM6UGMiE49ESOy3w8Vf2BSgbQ=:XEZaCIUqqoBXrBELJQfS6o6a/nLOs5iIkQhxzQCWKKQ=';
CREATE ROLE agro_user;
ALTER ROLE agro_user WITH SUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Pi4viKpZfXer5jzlzExpTg==$D6l0rOrC3krs07A680Qcp/kRaD7nUS4ufk2JpztIszA=:SXW4I4MLgAHl+AKFA0JY+KjJzNleDXDMUpjJHHlFAh4=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;

--
-- User Configurations
--






\unrestrict x2GzLtvQyhbtSwqZca7mfhud3PwsSlQQtf9wHW135ymyQ3OqDdbrte89SwNSPqI

--
-- PostgreSQL database cluster dump complete
--

