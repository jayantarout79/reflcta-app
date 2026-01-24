create or replace function public.execute_analytics_query(
  sql_query text,
  sql_params jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
as $$
declare
  param_value jsonb;
  idx int := 1;
  query text := sql_query;
  rows jsonb;
  array_literal text;
begin
  perform set_config('statement_timeout', '5000', true);
  if query !~* '^\s*select' then
    raise exception 'Only SELECT queries are allowed.';
  end if;

  for param_value in select value from jsonb_array_elements(sql_params) loop
    if jsonb_typeof(param_value) = 'array' then
      select 'ARRAY[' || string_agg(quote_literal(value::text), ',') || ']'
      into array_literal
      from jsonb_array_elements(param_value);
      query := replace(query, '$' || idx, array_literal);
    else
      query := replace(query, '$' || idx, quote_literal(param_value::text));
    end if;
    idx := idx + 1;
  end loop;

  execute format(
    'select jsonb_build_object(''rows'', coalesce(jsonb_agg(row_to_json(q)), ''[]''::jsonb), ''row_count'', count(*)) from (%s) q',
    query
  ) into rows;

  return rows;
end;
$$;
