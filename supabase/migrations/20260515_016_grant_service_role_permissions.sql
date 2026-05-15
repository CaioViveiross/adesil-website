-- Garante que service_role tem acesso completo às tabelas usadas por APIs admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories       TO service_role;

-- Sequências também precisam de grant
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
