-- Query para entender el cálculo de streak
SELECT 
  'streak_break_days' as setting_name,
  value as setting_value,
  description
FROM system_settings 
WHERE key = 'streak_break_days'

UNION ALL

SELECT 
  'user_last_checkin' as setting_name,
  last_check_in::text as setting_value,
  'Fecha del último check-in del usuario' as description
FROM streaks 
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)

UNION ALL

SELECT 
  'calculation_example' as setting_name,
  (
    COALESCE(
      (SELECT value::int FROM system_settings WHERE key = 'streak_break_days'), 
      12
    ) - 
    EXTRACT(
      DAY FROM (
        CURRENT_DATE - 
        COALESCE(
          (SELECT last_check_in::date FROM streaks WHERE user_id = (SELECT id FROM auth.users LIMIT 1)),
          CURRENT_DATE
        )
      )
    )
  )::text as setting_value,
  'Cálculo: streak_break_days - días_desde_último_checkin' as description;