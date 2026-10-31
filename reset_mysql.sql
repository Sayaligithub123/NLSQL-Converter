FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Admin@1234';
DROP USER IF EXISTS 'readonly_user'@'localhost';
CREATE USER 'readonly_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Readonly@1234';
GRANT SELECT, SHOW VIEW, SHOW DATABASES ON *.* TO 'readonly_user'@'localhost';
FLUSH PRIVILEGES;
