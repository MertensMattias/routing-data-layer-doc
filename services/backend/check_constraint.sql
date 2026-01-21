SELECT 
    dc.name AS constraint_name, 
    c.name AS column_name, 
    t.name AS table_name, 
    dc.definition
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
INNER JOIN sys.tables t ON dc.parent_object_id = t.object_id
WHERE t.name = 'sys_AuditLog' AND c.name = 'AuditLogId';
