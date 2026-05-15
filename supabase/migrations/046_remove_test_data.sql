-- 046_remove_test_data.sql
-- Elimina los datos de prueba insertados en migraciones anteriores.
-- Los proyectos en producción deben iniciar sin premios ni sucursales precargadas.
-- El superadmin puede configurarlos desde el panel de administración.

-- Eliminar sucursal de prueba (insertada en 009_add_test_branch.sql)
DELETE FROM public.branches WHERE name = 'Sucursal de Prueba';

-- Eliminar premios de prueba (insertados en 001_schema_completo_dbreset.sql)
DELETE FROM public.prizes WHERE name IN (
  'Café Gratis',
  'Descuento 10%',
  'Postre Gratis',
  'Bebida Gratis',
  'Combo Especial',
  'Premio 5 Visitas',
  'Premio 10 Visitas',
  'Premio 15 Visitas',
  'Premio Racha Completa'
);
