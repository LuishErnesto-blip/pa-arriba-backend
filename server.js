// Importaciones de módulos
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Importa el módulo CORS
const app = express();
const port = process.env.PORT || 3000; // Usar el puerto proporcionado por el entorno (Render), o 3000 por defecto
// Configuración de la conexión a PostgreSQL
// Configuración de la conexión a PostgreSQL (usando variables de entorno para Render)
const pool = new Pool({
    user: process.env.DB_USER, // Variable de entorno para el usuario de la DB
    host: process.env.DB_HOST, // Variable de entorno para el host de la DB
    database: process.env.DB_NAME, // Variable de entorno para el nombre de la DB
    password: process.env.DB_PASSWORD, // Variable de entorno para la contraseña de la DB
    port: process.env.DB_PORT, // Variable de entorno para el puerto de la DB
    ssl: { // Configuración SSL/TLS para conexiones seguras (necesario en Render)
        rejectUnauthorized: false
    }
});
// Middleware
const corsOptions = {
    origin: ['http://localhost:3001', 'http://192.168.100.16:3001'], // Permite ambos orígenes
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // Habilita CORS con opciones específicas
app.use(express.json()); // Para parsear cuerpos de solicitud JSON

// Función auxiliar para realizar consultas a la base de datos
const query = (text, params) => pool.query(text, params);

// --- Rutas de Materia Prima (AHORA APUNTANDO A 'ingredientes' en la BD y columnas correctas) ---

// Obtener toda la materia prima
app.get('/materia-prima', async (req, res) => {
    try {
        // CORRECCIÓN: 'materia_prima' a 'ingredientes' y selección de columnas correctas
const { nombre, fechaInicio, fechaFin } = req.query; // Extrae el parámetro 'nombre' de la URL de la solicitud
let sqlQuery = 'SELECT id, nombre, cantidad, unidad, costo, fecha_ingreso, descripcion FROM ingredientes';
const queryParams = []; // Array para almacenar los valores de los parámetros de la consulta SQL
const conditions = []; // Array para almacenar las cláusulas WHERE individuales
let paramIndex = 1; // Para llevar la cuenta de los placeholders $1, $2, etc.
if (nombre) {
    conditions.push(`nombre ILIKE $${paramIndex}`);
    queryParams.push(`%${nombre}%`);
    paramIndex++;
}

if (fechaInicio) {
    conditions.push(`fecha_ingreso >= $${paramIndex}`);
    queryParams.push(fechaInicio);
    paramIndex++;
}

if (fechaFin) {
    conditions.push(`fecha_ingreso <= $${paramIndex}`);
    queryParams.push(fechaFin);
    paramIndex++;
}

if (conditions.length > 0) {
    sqlQuery += ' WHERE ' + conditions.join(' AND '); // Une las condiciones con 'AND' si hay alguna
}
sqlQuery += ' ORDER BY nombre ASC'; // Mantiene el ordenamiento, se concatena SIEMPRE
const result = await query(sqlQuery, queryParams.length > 0 ? queryParams : undefined); // Ejecuta la consulta SQL, pasando los parámetros si existen
        console.log('DEBUG BACKEND: [GET /materia-prima] Materia prima obtenida:', result.rows);
        res.json(result.rows);
        } catch (err) {
        console.error('❌ Error al obtener materia prima (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener materia prima.' });
    }
});

// Obtener materia prima por ID
app.get('/materia-prima/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECCIÓN: 'materia_prima' a 'ingredientes' y selección de columnas correctas
        const result = await query('SELECT id, nombre, cantidad, unidad, costo, fecha_ingreso, descripcion FROM ingredientes WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Materia prima no encontrada.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener materia prima por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener materia prima por ID.' });
    }
});

// Agregar nueva materia prima
app.post('/materia-prima', async (req, res) => {
    // CAMBIO: Recibir los nombres de los campos del frontend que ahora coinciden con la BD
    const { nombre, unidad, costo, cantidad, fecha_ingreso, descripcion } = req.body; // ANTES: tipo_unidad, costo_unitario, cantidad_disponible
    
    // CAMBIO: Usar los nombres de las variables actualizados en la validación
    if (!nombre || !unidad || costo === undefined || cantidad === undefined || !fecha_ingreso) { // ANTES: !tipo_unidad, costo_unitario === undefined, cantidad_disponible === undefined
        return res.status(400).json({ error: 'Faltan campos obligatorios para agregar materia prima.' });
    }
    
    const sql = `INSERT INTO ingredientes (nombre, unidad, costo, cantidad, fecha_ingreso, descripcion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    // Los parámetros ya se pasan en el orden correcto para la BD
    const params = [
        nombre,
        unidad,          // Ahora ya coincide directamente
        costo,           // Ahora ya coincide directamente
        cantidad,        // Ahora ya coincide directamente
        fecha_ingreso,
        descripcion
    ];

    try {
        const result = await query(sql, params);
        res.status(201).json({ id: result.rows[0].id, message: 'Materia prima agregada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al agregar materia prima (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al agregar materia prima.' });
    }
});

// Actualizar materia prima
app.put('/materia-prima/:id', async (req, res) => {
    const { id } = req.params;
    // CAMBIO: Recibir los nombres de los campos del frontend que ahora coinciden con la BD
    const { nombre, unidad, costo, cantidad, fecha_ingreso, descripcion } = req.body; // ANTES: tipo_unidad, costo_unitario, cantidad_disponible
    
    // CAMBIO: Usar los nombres de las variables actualizados en la validación
    if (!nombre || !unidad || costo === undefined || cantidad === undefined || !fecha_ingreso) { // ANTES: !tipo_unidad, costo_unitario === undefined, cantidad_disponible === undefined
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar materia prima.' });
    }
    
    const sql = `UPDATE ingredientes SET nombre = $1, unidad = $2, costo = $3, cantidad = $4, fecha_ingreso = $5, descripcion = $6 WHERE id = $7`;
    const params = [
        nombre,
        unidad,          // Ahora ya coincide directamente
        costo,           // Ahora ya coincide directamente
        cantidad,        // Ahora ya coincide directamente
        fecha_ingreso,
        descripcion,
        id
    ];

    try {
        await query(sql, params);
        res.json({ message: 'Materia prima actualizada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al actualizar materia prima (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar materia prima.' });
    }
});

// Eliminar materia prima
app.delete('/materia-prima/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECCIÓN: 'materia_prima' a 'ingredientes'
        await query('DELETE FROM ingredientes WHERE id = $1', [id]);
        res.json({ message: 'Materia prima eliminada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar materia prima (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar materia prima.' });
    }
});
// --- Ruta para obtener solo los nombres únicos de ingredientes para el filtro de Materia Prima ---
app.get('/ingredientes/nombres', async (req, res) => {
    try {
        const result = await query('SELECT DISTINCT nombre FROM ingredientes ORDER BY nombre ASC');
        const nombresIngredientes = result.rows.map(row => row.nombre);
        res.status(200).json(nombresIngredientes);
    } catch (error) {
        console.error('❌ Error al obtener nombres de ingredientes para el filtro:', error);
        res.status(500).json({ error: 'Error del servidor al obtener nombres de ingredientes para el filtro.' });
    }
});

// --- Rutas de Compras (RESTAURADAS Y AJUSTADAS AL ESQUEMA REAL DE TU BD 'compras') ---

// Obtener todas las compras
app.get('/compras', async (req, res) => {
    try {
        // CORRECCIÓN: Seleccionar solo las columnas existentes en tu tabla 'compras'
        // Se elimina el JOIN a 'materia_prima_id' / 'ingredientes' ya que no hay FK en tu esquema actual
        const result = await query(`
            SELECT
                id,
                producto,
                cantidad,
                unidad,
                costo_unitario,
                costo_total,
                fecha,
                fecha_creacion,
                fecha_actualizacion
            FROM
                compras
            ORDER BY fecha DESC, id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener compras (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener compras.' });
    }
});

// Obtener compra por ID
app.get('/compras/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM compras WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Compra no encontrada.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener compra por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener compra por ID.' });
    }
});

// Registrar nueva compra
app.post('/compras', async (req, res) => {
    // Parámetros de req.body recibidos del frontend (materia_prima_id, cantidad_comprada, costo_total_compra, fecha_compra, proveedor, factura)
    // Se mapean a las columnas REALES de tu tabla 'compras': producto, cantidad, unidad, costo_unitario, fecha
    // NOTA: 'proveedor', 'factura' no existen en tu esquema actual de 'compras'
    // NOTA: 'materia_prima_id' del frontend se asume que es el 'nombre' del producto para 'compras.producto'
    const { materia_prima_id, cantidad_comprada, costo_total_compra, fecha_compra /* , proveedor, factura */ } = req.body;

    if (!materia_prima_id || cantidad_comprada === undefined || costo_total_compra === undefined || !fecha_compra) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar compra.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciar transacción

        // Antes de insertar, necesitamos 'unidad' y 'costo_unitario' del ingrediente por su nombre
        // Asumiendo que materia_prima_id del frontend es el 'nombre' del producto/ingrediente
        const ingredienteInfo = await client.query('SELECT unidad, costo FROM ingredientes WHERE nombre = $1', [materia_prima_id]);
        if (ingredienteInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Materia prima no encontrada para el registro de compra por nombre.' });
        }
        const { unidad, costo } = ingredienteInfo.rows[0];

        // 1. Insertar la nueva compra en la tabla 'compras'
        // Columnas utilizadas: producto, cantidad, unidad, costo_unitario, fecha
        const insertCompraSql = `
            INSERT INTO compras (producto, cantidad, unidad, costo_unitario, fecha)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `;
        const insertCompraParams = [
            materia_prima_id,   // Frontend 'materia_prima_id' se usa como 'producto' (nombre)
            cantidad_comprada,  // Frontend 'cantidad_comprada' se usa como 'cantidad'
            unidad,             // Obtenido de 'ingredientes'
            costo,              // Obtenido de 'ingredientes'
            fecha_compra
        ];
        const result = await client.query(insertCompraSql, insertCompraParams);
        const newCompraId = result.rows[0].id;

        // 2. Lógica de actualización de cantidad_disponible de materia prima (ingredientes)
        // Se asume que la 'cantidad' en 'ingredientes' es el stock disponible.
        // Se sumará la 'cantidad_comprada' a la columna 'cantidad' de la tabla 'ingredientes'
        const updateMateriaPrimaSql = `UPDATE ingredientes SET cantidad = cantidad + $1 WHERE nombre = $2`; // Actualiza por nombre
        const updateMateriaPrimaParams = [cantidad_comprada, materia_prima_id]; // Usa el nombre para buscar
        await client.query(updateMateriaPrimaSql, updateMateriaPrimaParams);


        await client.query('COMMIT'); // Confirmar transacción
        res.status(201).json({ id: newCompraId, message: 'Compra registrada exitosamente y stock actualizado.' });

    } catch (err) {
        await client.query('ROLLBACK'); // Revertir transacción en caso de error
        console.error('❌ Error al registrar compra y actualizar stock (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar compra y actualizar stock.' });
    } finally {
        client.release();
    }
});

// Actualizar compra
app.put('/compras/:id', async (req, res) => {
    const { id } = req.params;
    const { materia_prima_id, cantidad_comprada, costo_total_compra, fecha_compra /* , proveedor, factura */ } = req.body;

    if (!materia_prima_id || cantidad_comprada === undefined || costo_total_compra === undefined || !fecha_compra) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar compra.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener la cantidad comprada original y el nombre del producto original para ajustar el stock
        const oldCompraResult = await client.query('SELECT cantidad AS old_cantidad, producto AS old_producto FROM compras WHERE id = $1', [id]);
        if (oldCompraResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Compra no encontrada para actualizar.' });
        }
        const { old_cantidad, old_producto } = oldCompraResult.rows[0];

        // Obtener la 'unidad' y 'costo_unitario' del ingrediente por su nuevo nombre (si cambió)
        const ingredienteInfo = await client.query('SELECT unidad, costo FROM ingredientes WHERE nombre = $1', [materia_prima_id]);
        if (ingredienteInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Nueva materia prima no encontrada para la actualización de compra por nombre.' });
        }
        const { unidad, costo } = ingredienteInfo.rows[0];

        // 1. Actualizar la compra
        const updateCompraSql = `
            UPDATE compras
            SET producto = $1, cantidad = $2, unidad = $3, costo_unitario = $4, fecha = $5
            WHERE id = $6
        `;
        const updateCompraParams = [
            materia_prima_id,   // Frontend 'materia_prima_id' se usa como 'producto' (nombre)
            cantidad_comprada,  // Frontend 'cantidad_comprada' se usa como 'cantidad'
            unidad,
            costo,
            fecha_compra,
            id
        ];
        await client.query(updateCompraSql, updateCompraParams);

        // 2. Ajustar la cantidad disponible de la materia prima (ingredientes)
        // Revertir el stock de la materia prima antigua
        await client.query(`UPDATE ingredientes SET cantidad = cantidad - $1 WHERE nombre = $2`, [old_cantidad, old_producto]);
        // Añadir el stock a la nueva materia prima
        await client.query(`UPDATE ingredientes SET cantidad = cantidad + $1 WHERE nombre = $2`, [cantidad_comprada, materia_prima_id]);
        
        await client.query('COMMIT');
        res.json({ message: 'Compra actualizada exitosamente y stock ajustado.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error al actualizar compra y ajustar stock (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar compra y ajustar stock.' });
    } finally {
        client.release();
    }
});

// Eliminar compra
app.delete('/compras/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener la cantidad comprada y el producto para revertir el stock
            const compraToDeleteResult = await client.query('SELECT cantidad AS old_cantidad, producto AS old_producto FROM compras WHERE id = $1', [id]);
            if (compraToDeleteResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Compra no encontrada para eliminar.' });
            }
            const { old_cantidad, old_producto } = compraToDeleteResult.rows[0];

            // Eliminar la compra
            await client.query('DELETE FROM compras WHERE id = $1', [id]);

            // Revertir la cantidad disponible de la materia prima (restar la cantidad eliminada)
            await client.query(`UPDATE ingredientes SET cantidad = cantidad - $1 WHERE nombre = $2`, [old_cantidad, old_producto]);

            await client.query('COMMIT');
            res.json({ message: 'Compra eliminada exitosamente y stock revertido.' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Error al eliminar compra y revertir stock (PG):', err.message);
            res.status(500).json({ error: 'Error interno del servidor al eliminar compra y revertir stock.' });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error en el proceso de eliminación de compra (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar compra.' });
    }
});


// --- Rutas de Recetas Estándar ---

// Obtener todas las recetas estándar (con o sin filtro es_producto_final)
app.get('/recetas-estandar', async (req, res) => {
    try {
        const { es_producto_final } = req.query;
        let sql = `SELECT * FROM recetas_estandar`;
        const params = [];
        if (es_producto_final !== undefined) {
            sql += ` WHERE es_producto_final = $1`;
            params.push(es_producto_final === 'true'); // Convertir a booleano
        }
        sql += ` ORDER BY nombre_platillo ASC`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener recetas estándar (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener recetas estándar.' });
    }
});
// Ruta NUEVA: Para obtener todas las recetas (genérica, sin filtros específicos por "estandar")
// El frontend en RecetasEstandar.js hace GET a /recetas
app.get('/recetas', async (req, res) => {
    try {
        // Selecciona todas las recetas ordenadas por ID o nombre.
        // Asegúrate de que tu tabla 'recetas' exista y tenga al menos las columnas 'id' y 'nombre'.
        const result = await pool.query('SELECT id, nombre, descripcion, precio FROM recetas ORDER BY nombre ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener todas las recetas (GET /recetas):', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las recetas.' });
    }
});

// Obtener una receta estándar por ID
app.get('/recetas-estandar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM recetas_estandar WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Receta estándar no encontrada.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener receta estándar por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener receta estándar por ID.' });
    }
});

// Agregar nueva receta estándar
app.post('/recetas-estandar', async (req, res) => {
    // Solo requerimos nombre (del frontend) y es_producto_final para la creación inicial.
const { nombre, es_producto_final, foto_url, descripcion } = req.body;
    if (!nombre || es_producto_final === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (nombre y es_producto_final) para agregar receta estándar.' });
    }
    // Calcular utilidad bruta

// Calcular porcentaje de utilidad, manejando división por cero
    const sql = `
        INSERT INTO recetas_estandar (nombre_platillo, es_producto_final, foto_url, descripcion, costo_total_calculado, precio_venta, utilidad_bruta, porcentaje_utilidad)
VALUES ($1, $2, $3, $4, 0, 0, 0, 0) RETURNING id
        `; // CAMBIO CRÍTICO: Usar 'nombre_platillo' en la SQL para que coincida con la BD.
       // El $1 se mapeará al 'nombre' que viene del frontend.
    const params = [
        nombre, // El valor 'nombre' del frontend se insertará en la columna 'nombre_platillo'
        es_producto_final,
        foto_url || null,
        descripcion || null,
            ];

    try {
        const result = await pool.query(sql, params); // Usar pool.query directamente
        res.status(201).json({ id: result.rows[0].id, message: 'Receta estándar agregada exitosamente. Costos y Precios se calcularán después.' });
    } catch (err) {
        console.error('❌ Error al agregar receta estándar (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al agregar receta estándar.' });
    }
});

// Actualizar receta estándar
app.put('/recetas-estandar/:id', async (req, res) => {
    const { id } = req.params;
const { nombre_platillo, es_producto_final, costo_total_calculado, precio_venta, foto_url, descripcion } = req.body;
if (!nombre_platillo || es_producto_final === undefined || costo_total_calculado === undefined || precio_venta === undefined) {
return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar receta estándar.' });
    }
   // Calcular utilidad bruta y porcentaje de utilidad
const utilidad_bruta = parseFloat(precio_venta) - parseFloat(costo_total_calculado);
const porcentaje_utilidad = costo_total_calculado && parseFloat(costo_total_calculado) !== 0
    ? (utilidad_bruta / parseFloat(costo_total_calculado)) * 100
    : 0;
const sql = `UPDATE recetas_estandar SET nombre_platillo = $1, es_producto_final = $2, costo_total_calculado = $3, precio_venta = $4, utilidad_bruta = $5, porcentaje_utilidad = $6, foto_url = $7, descripcion = $8 WHERE id = $9`;
const params = [nombre_platillo, es_producto_final, costo_total_calculado, precio_venta, utilidad_bruta, porcentaje_utilidad, foto_url || null, descripcion || null, id];
    try {
        await query(sql, params);
        res.json({ message: 'Receta estándar actualizada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al actualizar receta estándar (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar receta estándar.' });
    }
});

// Ruta para actualizar el costo_total_calculado y precio_venta de una receta
app.put('/recetas-estandar/calcular-costo/:id', async (req, res) => {
    const { id } = req.params;
    const { costo_total_calculado, porcentaje_utilidad_deseado } = req.body;

    if (costo_total_calculado === undefined || porcentaje_utilidad_deseado === undefined) {
        return res.status(400).json({ error: 'Faltan datos para calcular y actualizar el costo y precio de venta.' });
    }

    try {
        // Calcular el precio de venta y utilidad_bruta
        const precio_venta = costo_total_calculado * (1 + porcentaje_utilidad_deseado / 100);
        const utilidad_bruta = precio_venta - costo_total_calculado;

        const sql = `
            UPDATE recetas_estandar
            SET
                costo_total_calculado = $1,
                precio_venta = $2,
                utilidad_bruta = $3,
                porcentaje_utilidad = $4
            WHERE id = $5
            RETURNING *;
        `;
        const params = [
            parseFloat(costo_total_calculado).toFixed(2),
            parseFloat(precio_venta).toFixed(2),
            parseFloat(utilidad_bruta).toFixed(2),
            parseFloat(porcentaje_utilidad_deseado).toFixed(2),
            id
        ];

        const result = await query(sql, params);
        if (result.rows.length > 0) {
            console.log(`Costo total calculado para receta ${id} actualizado a : ${result.rows[0].costo_total_calculado}`);
            console.log(`Precio de venta calculado para receta ${id} actualizado a : ${result.rows[0].precio_venta}`);
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Receta no encontrada para actualizar costo.' });
        }
    } catch (err) {
        console.error('❌ Error al calcular y actualizar costo de receta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al calcular y actualizar costo de receta.' });
    }
});


// --- Rutas de Ingredientes de Receta ---

// Obtener ingredientes de una receta específica
// Obtener ingredientes de una receta específica (incluyendo materia prima y sub-recetas)
app.get('/recetas-estandar/:recetaId/ingredientes', async (req, res) => {
    try {
        const { recetaId } = req.params;

        // CORRECCIÓN: Seleccionar todos los campos de ingredientes_receta.
        // Luego, unir condicionalmente con 'ingredientes' o 'recetas_estandar'
        // para obtener detalles adicionales según el tipo_componente.
        const sql = `
            SELECT
                ir.id,
                ir.receta_id,
                ir.tipo_componente,
                ir.nombre_componente,
                ir.subreceta_referencia_id,
                ir.materia_prima_id,
                ir.cantidad, -- CAMBIO: Usar 'cantidad' de ingredientes_receta
                ir.unidad,
                ir.costo_unitario,
                -- Información adicional si es un ingrediente base
                mp.nombre AS mp_nombre_original,
                mp.unidad AS mp_unidad_original,
                mp.costo AS mp_costo_original,
                -- Información adicional si es una sub-receta
                sr.nombre_platillo AS sr_nombre_original,
                sr.costo_total_calculado AS sr_costo_total_calculado
            FROM
                ingredientes_receta ir
            LEFT JOIN -- Usar LEFT JOIN para incluir todos los ingredientes_receta, incluso si no tienen match en mp o sr
                ingredientes mp ON ir.materia_prima_id = mp.id AND ir.tipo_componente = 'ingrediente_base'
            LEFT JOIN
                recetas_estandar sr ON ir.subreceta_referencia_id = sr.id AND ir.tipo_componente = 'sub_receta'
            WHERE
                ir.receta_id = $1
            ORDER BY ir.nombre_componente ASC; -- Ordenar por el nombre del componente
        `;
        const result = await query(sql, [recetaId]);

        // Procesar los resultados para darles un formato coherente en el frontend
        const processedIngredients = result.rows.map(row => {
            let costoUnitarioFinal = parseFloat(row.costo_unitario || 0); // Usar el costo unitario guardado en ingredientes_receta
            let unidadFinal = row.unidad; // Usar la unidad guardada en ingredientes_receta
            let nombreComponenteFinal = row.nombre_componente; // Usar el nombre guardado

            // Si es ingrediente base y no se asignó un costo_unitario en ir, intentar usar el original de mp
            if (row.tipo_componente === 'ingrediente_base' && !row.costo_unitario && row.mp_costo_original) {
                costoUnitarioFinal = parseFloat(row.mp_costo_original);
            }
            // Si es sub-receta y no se asignó un costo_unitario en ir, intentar usar el costo total calculado de sr
            if (row.tipo_componente === 'sub_receta' && !row.costo_unitario && row.sr_costo_total_calculado) {
                costoUnitarioFinal = parseFloat(row.sr_costo_total_calculado);
            }

            // Si la unidad no fue guardada en ir, intentar usar la unidad original de mp
            if (row.tipo_componente === 'ingrediente_base' && !row.unidad && row.mp_unidad_original) {
                unidadFinal = row.mp_unidad_original;
            }

            // Si el nombre del componente no fue guardado en ir, usar el nombre original de mp o sr
            if (!row.nombre_componente) {
                if (row.tipo_componente === 'ingrediente_base' && row.mp_nombre_original) {
                    nombreComponenteFinal = row.mp_nombre_original;
                } else if (row.tipo_componente === 'sub_receta' && row.sr_nombre_original) {
                    nombreComponenteFinal = row.sr_nombre_original;
                }
            }


            return {
                id: row.id,
                receta_id: row.receta_id,
                materia_prima_id: row.materia_prima_id,
                subreceta_referencia_id: row.subreceta_referencia_id,
                cantidad: parseFloat(row.cantidad),
                unidad: unidadFinal,
                costo_unitario: costoUnitarioFinal,
                tipo_componente: row.tipo_componente,
                nombre_componente: nombreComponenteFinal,
                // Puedes añadir más propiedades si son necesarias para el frontend
                costo_total_componente: parseFloat(row.cantidad) * costoUnitarioFinal // Calcular costo total para este componente
            };
        });

        res.json(processedIngredients);
    } catch (err) {
        console.error('❌ Error al obtener ingredientes de receta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener ingredientes de receta.' });
    }
});

// Agregar ingrediente a una receta
app.post('/ingredientes-receta', async (req, res) => {
    try { // Esta es la línea 584 (inicio del reemplazo)
        let { receta_id, tipo_componente, nombre_componente, materia_prima_id, subreceta_referencia_id, cantidad, unidad, costo_unitario } = req.body;
        console.log('DEBUG BACKEND: [RAW REQ.BODY] costo_unitario recibido:', req.body.costo_unitario, 'Tipo:', typeof req.body.costo_unitario); // <-- INSERTA ESTA LÍNEA
        // Convertir cantidad a número de forma robusta
        cantidad = parseFloat(cantidad);
        if (isNaN(cantidad)) {
            console.error('DEBUG BACKEND: Cantidad no es un número válido:', req.body.cantidad);
            return res.status(400).json({ error: 'La cantidad debe ser un número válido.' });
        }

        // Asegurar que costo_unitario sea un número, o null si no aplica
        costo_unitario = parseFloat(costo_unitario);
        if (isNaN(costo_unitario)) {
            costo_unitario = null;
        }

        // Calcular costo_total_ingrediente
        // Si costo_unitario es null o 0, el costo_total_ingrediente también será 0
        const costo_total_ingrediente = (costo_unitario !== null && costo_unitario !== undefined)
                                        ? parseFloat((cantidad * costo_unitario).toFixed(4)) // Multiplicar y asegurar 4 decimales
                                        : 0.0000; // Por defecto a 0 si costo_unitario es null

        // Validar campos obligatorios
        if (!receta_id || isNaN(cantidad) || !tipo_componente || !nombre_componente) { // isNaN(cantidad) para asegurar que la cantidad sea válida
            return res.status(400).json({ error: 'Faltan campos obligatorios (receta_id, cantidad, tipo_componente, nombre_componente) para agregar ingrediente a receta.' });
        }

        // Logs de depuración para verificar valores antes de la inserción
        console.log('DEBUG BACKEND: [POST /ingredientes-receta] Valores finales para inserción:');
        console.log('DEBUG BACKEND:   receta_id:', receta_id);
        console.log('DEBUG BACKEND:   tipo_componente:', tipo_componente);
        console.log('DEBUG BACKEND:   nombre_componente:', nombre_componente);
        console.log('DEBUG BACKEND:   materia_prima_id:', materia_prima_id);
        console.log('DEBUG BACKEND:   subreceta_referencia_id:', subreceta_referencia_id);
        console.log('DEBUG BACKEND:   cantidad:', cantidad, 'Tipo:', typeof cantidad);
        console.log('DEBUG BACKEND:   unidad:', unidad);
        console.log('DEBUG BACKEND:   costo_unitario:', costo_unitario, 'Tipo:', typeof costo_unitario);
        console.log('DEBUG BACKEND:   costo_total_ingrediente:', costo_total_ingrediente, 'Tipo:', typeof costo_total_ingrediente);


        // Consulta SQL para insertar el ingrediente, incluyendo costo_total_ingrediente
        const query = `
            INSERT INTO ingredientes_receta (receta_id, tipo_componente, nombre_componente, materia_prima_id, subreceta_referencia_id, cantidad, unidad, costo_unitario, costo_total_ingrediente)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id;
        `;
        const values = [receta_id, tipo_componente, nombre_componente, materia_prima_id, subreceta_referencia_id, cantidad, unidad, costo_unitario, costo_total_ingrediente];

        const result = await pool.query(query, values);
        const nuevoIngredienteId = result.rows[0].id;

        // Después de insertar el ingrediente, recalcular los costos de la receta
        await recalculateRecipeCosts(receta_id);

        res.status(201).json({ id: nuevoIngredienteId, message: 'Ingrediente agregado a receta exitosamente. Costo de receta recalculado.' });
    } catch (error) {
        console.error('❌ Error al registrar ingrediente:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar ingrediente.' });
    }
}); 

// Función de ayuda para recalcular costos de receta (DEBE ESTAR DEFINIDA EN EL server.js)
// Asegúrate de que esta función exista en tu server.js. Si no, necesitarás crearla.
// Una versión básica para recalcular podría ser:
async function recalculateRecipeCosts(recipeId) {
    try {
        // CAMBIO CRÍTICO: Obtener directamente el costo_total_ingrediente de cada ingrediente
        const ingredientsResult = await pool.query(
            'SELECT costo_total_ingrediente FROM ingredientes_receta WHERE receta_id = $1',
            [recipeId]
        );
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] Ingredientes obtenidos para receta_id', recipeId, ':', ingredientsResult.rows); // <-- NUEVO LOG 1
        let totalCostoCalculado = 0;
        // Sumar los costo_total_ingrediente de todos los ingredientes
        for (const ing of ingredientsResult.rows) {
            totalCostoCalculado += parseFloat(ing.costo_total_ingrediente || 0);
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] Sumando ingrediente. costo_total_ingrediente:', ing.costo_total_ingrediente, 'Total acumulado:', totalCostoCalculado); // <-- NUEVO LOG 2
      
        }
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] Total Costo Calculado final:', totalCostoCalculado); // <-- NUEVO LOG 3 
        // Obtener el precio de venta actual de la receta estándar para calcular utilidad
        const recetaEstandarResult = await query('SELECT precio_venta, es_producto_final FROM recetas_estandar WHERE id = $1', [recipeId]); // CAMBIO: Seleccionar también es_producto_final
        const precioVentaOriginal = recetaEstandarResult.rows[0]?.precio_venta || 0; // Renombrada para claridad
        const esProductoFinal = recetaEstandarResult.rows[0]?.es_producto_final || false; // Nueva variable
        
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] es_producto_final de la receta:', esProductoFinal); // <-- NUEVO LOG 4
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] Precio de venta original de la receta:', precioVentaOriginal); // <-- NUEVO LOG 5
        
        let utilidadBruta = precioVentaOriginal - totalCostoCalculado; // Usar precioVentaOriginal para cálculo de utilidad
        let porcentajeUtilidad = (precioVentaOriginal > 0) ? (utilidadBruta / precioVentaOriginal) * 100 : 0;

        // Definir finalPrecioVenta. Si es_producto_final es TRUE, recalcular. Si no, mantener el original.
        let finalPrecioVenta = precioVentaOriginal; // Declaración de finalPrecioVenta
        if (esProductoFinal) {
            // Ejemplo de cálculo simple para precioVenta, puedes ajustar esta lógica
            // Por ejemplo, 1.33 = 33% de utilidad sobre el costo
            finalPrecioVenta = totalCostoCalculado * 1.33; // Ejemplo de recálculo
            // Asegurarse de que el precio no sea 0 si el costo es 0 pero quieres un precio base
            if (finalPrecioVenta === 0 && totalCostoCalculado === 0) {
                finalPrecioVenta = precioVentaOriginal; // Mantener el precio si no hay costo para evitar 0.00
            }
        }
        // Asegurarse de que finalPrecioVenta tenga 2 decimales para la DB si es numeric(10,2)
        finalPrecioVenta = parseFloat(finalPrecioVenta).toFixed(2);


        
// ... (Antes de la línea 658, donde comienza el console.log de DEBUG BACKEND: [recalculateRecipeCosts] Valores a actualizar)
        console.log('DEBUG BACKEND: [recalculateRecipeCosts] Valores a actualizar en recetas_estandar:', {
            id: recipeId,
            costo_total_calculado: totalCostoCalculado,
            precio_venta: finalPrecioVenta, // CAMBIO CRÍTICO: Usar finalPrecioVenta aquí
            utilidad_bruta: utilidadBruta,
            porcentaje_utilidad: porcentajeUtilidad,
            es_producto_final: esProductoFinal // Para el log

        });
        await query(
            'UPDATE recetas_estandar SET costo_total_calculado = $1, precio_venta = $2, utilidad_bruta = $3, porcentaje_utilidad = $4 WHERE id = $5 AND es_producto_final = TRUE', // CAMBIO CRÍTICO: Añadir precio_venta y la condición es_producto_final
            [totalCostoCalculado, finalPrecioVenta, utilidadBruta, porcentajeUtilidad, recipeId] // CAMBIO CRÍTICO: Añadir finalPrecioVenta
        );
        console.log(`✅ Costos para receta_estandar ID ${recipeId} recalculados exitosamente.`);
    } catch (error) {
        console.error(`❌ Error al recalcular costos para receta_estandar ID ${recipeId}:`, error.message);
        // No es necesario lanzar el error, solo registrarlo, para no bloquear la operación de inserción/actualización del ingrediente
    }
}
// Actualizar ingrediente de receta
app.put('/ingredientes-receta/:id', async (req, res) => {
    const { id } = req.params;
    // Extraer todas las propiedades que el frontend puede enviar para una actualización
    const {
        receta_id, // Es bueno recibirlo para el recálculo, aunque no se actualice la columna
        materia_prima_id,
        subreceta_referencia_id,
        cantidad, // CAMBIO: Usar 'cantidad', no 'cantidad_necesaria'
        unidad,
        costo_unitario,
        tipo_componente,
        nombre_componente
    } = req.body;

    // Validar campos obligatorios para la actualización
    if (!cantidad || !tipo_componente || !nombre_componente) { // Asumiendo que estos son siempre necesarios para la actualización
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar ingrediente de receta.' });
    }
    // Validar dependencias según tipo_componente (similar al POST)
    if (tipo_componente === 'ingrediente_base' && !materia_prima_id) {
        return res.status(400).json({ error: 'Para ingrediente base, materia_prima_id es obligatorio.' });
    }
    if (tipo_componente === 'sub_receta' && !subreceta_referencia_id) {
        return res.status(400).json({ error: 'Para sub-receta, subreceta_referencia_id es obligatorio.' });
    }

    const sql = `
        UPDATE ingredientes_receta SET 
            materia_prima_id = $1, 
            subreceta_referencia_id = $2, 
            cantidad = $3, 
            unidad = $4, 
            costo_unitario = $5, 
            tipo_componente = $6, 
            nombre_componente = $7
        WHERE id = $8 RETURNING receta_id; -- Retornar receta_id para recalcular costos
    `;
    const params = [
        materia_prima_id || null,
        subreceta_referencia_id || null,
        cantidad,
        unidad || null,
        costo_unitario || null,
        tipo_componente,
        nombre_componente,
        id
    ];

    try {
        const result = await query(sql, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ingrediente de receta no encontrado.' });
        }
        const updatedRecetaId = result.rows[0].receta_id;

        // Recalcular el costo de la receta principal después de actualizar el ingrediente
        if (updatedRecetaId) { // Asegurarse de que tenemos un receta_id válido
            await recalculateRecipeCosts(updatedRecetaId);
        }

        res.json({ message: 'Ingrediente de receta actualizado exitosamente. Costo de receta recalculado.' });
    } catch (err) {
        console.error('❌ Error al actualizar ingrediente de receta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar ingrediente de receta.' });
    }
});

// Eliminar ingrediente de receta
app.delete('/ingredientes-receta/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Primero, obtener el receta_id del ingrediente antes de eliminarlo
        const getRecetaIdSql = 'SELECT receta_id FROM ingredientes_receta WHERE id = $1';
        const result = await query(getRecetaIdSql, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ingrediente de receta no encontrado.' });
        }

        const recetaIdToDeleteFrom = result.rows[0].receta_id;

        // Luego, eliminar el ingrediente de la tabla 'ingredientes_receta'
        await query('DELETE FROM ingredientes_receta WHERE id = $1', [id]); // ESTA ES LA LÍNEA CORRECTA PARA ESTA RUTA

        // Recalcular el costo de la receta principal después de eliminar el ingrediente
        if (recetaIdToDeleteFrom) { // Asegurarse de que tenemos un receta_id válido
            await recalculateRecipeCosts(recetaIdToDeleteFrom);
        }
        
        res.json({ message: 'Ingrediente de receta eliminado exitosamente. Costo de receta recalculado.' });
    } catch (err) {
        console.error('❌ Error al eliminar ingrediente de receta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar ingrediente de receta.' });
    }
});

// --- Rutas de Ventas ---

// Obtener todas las ventas (con soporte para filtro de rango de fechas)
app.get('/ventas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let sql = `
            SELECT
                v.id,
                v.fecha,
                v.platillo_id,
                v.cantidad,
                v.precio_unitario,
                v.total_venta,
                v.metodo_pago,
                v.descripcion,
                re.nombre_platillo
            FROM
                ventas v
            JOIN
                recetas_estandar re ON v.platillo_id = re.id
        `;
        let params = [];
        let paramCount = 0;

        if (fechaInicio && fechaFin) {
            sql += ` WHERE v.fecha BETWEEN $${++paramCount} AND $${++paramCount}`;
            params.push(fechaInicio, fechaFin);
        } else {
            // Si no se proporcionan fechas, por defecto traer todas las ventas,
            // o podrías agregar aquí un filtro por CURRENT_DATE si así lo deseas
        }

        sql += ` ORDER BY v.fecha DESC, v.id DESC;`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener ventas (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener ventas.' });
    }
});

// Obtener venta por ID
app.get('/ventas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM ventas WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Venta no encontrada.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener venta por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener venta por ID.' });
    }
});

// Registrar nueva venta
app.post('/ventas', async (req, res) => {
    const { fecha, platillo_id, cantidad, precio_unitario, total_venta, metodo_pago, descripcion } = req.body;
    if (!fecha || !platillo_id || cantidad === undefined || precio_unitario === undefined || total_venta === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar venta.' });
    }
    const sql = `
        INSERT INTO ventas (fecha, platillo_id, cantidad, precio_unitario, total_venta, metodo_pago, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    `;
    const params = [fecha, platillo_id, cantidad, precio_unitario, total_venta, metodo_pago || null, descripcion || null];
    try {
        const result = await query(sql, params);
        const newId = result.rows[0].id;
        res.status(201).json({ id: newId, message: 'Venta registrada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al registrar venta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar venta.' });
    }
});

// Actualizar venta
app.put('/ventas/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, platillo_id, cantidad, precio_unitario, total_venta, metodo_pago, descripcion } = req.body;
    if (!fecha || !platillo_id || cantidad === undefined || precio_unitario === undefined || total_venta === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar venta.' });
    }
    const sql = `UPDATE ventas SET fecha = $1, platillo_id = $2, cantidad = $3, precio_unitario = $4, total_venta = $5, metodo_pago = $6, descripcion = $7 WHERE id = $8`;
    const params = [fecha, platillo_id, cantidad, precio_unitario, total_venta, metodo_pago || null, descripcion || null, id];

    try {
        await query(sql, params);
        res.json({ message: 'Venta actualizada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al actualizar venta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar venta.' });
    }
});

// Eliminar venta
app.delete('/ventas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM ventas WHERE id = $1', [id]);
        res.json({ message: 'Venta eliminada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar venta (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar venta.' });
    }
});


// --- Rutas de Pagos del Día (CORREGIDAS A 'pagos_diarios' en la BD) ---

// Obtener todos los pagos del día
app.get('/pagos-del-dia', async (req, res) => {
    try {
const { tipoPago, fechaInicio, fechaFin } = req.query; // Extrae TIPO PAGO también

let sqlQuery = 'SELECT id, fecha, tipo_pago, monto, descripcion, metodo_pago FROM pagos_diarios'; // Seleccionar columnas específicas
const queryParams = []; // Array para almacenar los valores de los parámetros
const conditions = []; // Array para almacenar las cláusulas WHERE
let paramIndex = 1; // Para los placeholders $1, $2, etc.

// Filtro por tipo de pago
if (tipoPago) {
    conditions.push(`tipo_pago = $${paramIndex}`);
    queryParams.push(tipoPago);
    paramIndex++;
}

// Filtro por rango de fechas
if (fechaInicio) {
    conditions.push(`fecha >= $${paramIndex}`);
    queryParams.push(fechaInicio);
    paramIndex++;
}

if (fechaFin) {
    conditions.push(`fecha <= $${paramIndex}`);
    queryParams.push(fechaFin);
    paramIndex++;
}

// Construir la cláusula WHERE si hay condiciones
if (conditions.length > 0) {
    sqlQuery += ' WHERE ' + conditions.join(' AND ');
}

sqlQuery += ' ORDER BY fecha DESC, id DESC;'; // Mantener el ordenamiento existente
        const result = await query(sqlQuery, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener pagos del día (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener pagos del día.' });
    }
});

// Obtener pago del día por ID
app.get('/pagos-del-dia/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECCIÓN: 'pagos_del_dia' a 'pagos_diarios'
        const result = await query('SELECT * FROM pagos_diarios WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Pago del día no encontrado.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener pago del día por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener pago del día por ID.' });
    }
});

// Registrar nuevo pago del día
app.post('/pagos-del-dia', async (req, res) => {
    const { fecha, tipo_pago, monto, descripcion, metodo_pago } = req.body;
    if (!fecha || !tipo_pago || monto === undefined || !metodo_pago) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar pago del día.' });
    }
    // CORRECCIÓN: 'pagos_del_dia' a 'pagos_diarios'
    const sql = `INSERT INTO pagos_diarios (fecha, tipo_pago, monto, descripcion, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    const params = [fecha, tipo_pago, monto, descripcion || null, metodo_pago];

    try {
        const result = await query(sql, params);
        res.status(201).json({ id: result.rows[0].id, message: 'Pago registrado exitosamente.' });
    } catch (err) {
        console.error('❌ Error al registrar pago del día (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar pago del día.' });
    }
});

// Actualizar pago del día
app.put('/pagos-del-dia/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, tipo_pago, monto, descripcion, metodo_pago } = req.body;
    if (!fecha || !tipo_pago || monto === undefined || !metodo_pago) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar pago del día.' });
    }
    // CORRECCIÓN: 'pagos_del_dia' a 'pagos_diarios'
    const sql = `UPDATE pagos_diarios SET fecha = $1, tipo_pago = $2, monto = $3, descripcion = $4, metodo_pago = $5 WHERE id = $6`;
    const params = [fecha, tipo_pago, monto, descripcion || null, metodo_pago, id];

    try {
        await query(sql, params);
        res.json({ message: 'Pago del día actualizado exitosamente.' });
    } catch (err) {
        console.error('❌ Error al actualizar pago del día (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar pago del día.' });
    }
});

// Eliminar pago del día
app.delete('/pagos-del-dia/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECCIÓN: 'pagos_del_dia' a 'pagos_diarios'
        await query('DELETE FROM pagos_diarios WHERE id = $1', [id]);
        res.json({ message: 'Pago del día eliminado exitosamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar pago del día (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar pago del día.' });
    }
});


// --- Rutas de Metas Diarias ---

// Obtener todas las metas diarias (con cálculo de progreso y soporte de filtros de fecha)
app.get('/metas-diarias', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        // Consulta SQL para obtener metas y calcular ventas totales para cada meta
        // Usamos un LEFT JOIN para incluir metas que quizás no tengan ventas aún
        // Agrupamos por los campos de la meta para sumar las ventas
        let sql = `
            SELECT
                m.id,
                m.fecha,
                m.meta_venta_diaria,
                COALESCE(SUM(v.total_venta), 0) AS ventas_totales_para_meta
            FROM
                metas_diarias m
            LEFT JOIN
                ventas v ON m.fecha = v.fecha
        `;
        const params = [];
        let paramCount = 0;

        // Añadir cláusula WHERE para filtrar por rango de fechas si se proporcionan
        if (fechaInicio && fechaFin) {
            sql += ` WHERE m.fecha BETWEEN $${++paramCount} AND $${++paramCount}`;
            params.push(fechaInicio, fechaFin);
        } else {
            // Si no hay filtro de fechas, la lógica por defecto traerá todas las metas con sus ventas acumuladas.
            // El frontend (MiMetaDeHoy.js) se encargará de enviar las fechas adecuadas.
        }

        sql += ` GROUP BY m.id, m.fecha, m.meta_venta_diaria ORDER BY m.fecha DESC;`;

        const result = await query(sql, params);

        // Mapear resultados para calcular el progreso
        const metasConProgreso = result.rows.map(meta => {
            const progreso = meta.meta_venta_diaria > 0
                ? (meta.ventas_totales_para_meta / meta.meta_venta_diaria) * 100
                : (meta.ventas_totales_para_meta > 0 ? 100 : 0); // Si meta es 0 pero hay ventas, progreso es 100%

            return {
                id: meta.id,
                fecha: meta.fecha,
                meta_venta_diaria: parseFloat(meta.meta_venta_diaria),
                ventas_totales_para_meta: parseFloat(meta.ventas_totales_para_para_meta),
                progreso_calculado: parseFloat(progreso.toFixed(2)) // Formatear a 2 decimales
            };
        });

        res.json(metasConProgreso);
    } catch (err) {
        console.error('❌ Error al obtener metas diarias (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener metas diarias.' });
    }
});

// Obtener meta diaria por ID
app.get('/metas-diarias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM metas_diarias WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Meta diaria no encontrada.' });
        }
    } catch (err) {
        console.error('❌ Error al obtener meta diaria por ID (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener meta diaria por ID.' });
    }
});

// Registrar nueva meta diaria
app.post('/metas-diarias', async (req, res) => {
    const { fecha, meta_venta_diaria } = req.body;
    if (!fecha || meta_venta_diaria === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar meta diaria.' });
    }
    const sql = `INSERT INTO metas_diarias (fecha, meta_venta_diaria) VALUES ($1, $2) RETURNING id`;
    const params = [fecha, meta_venta_diaria];

    try {
        const result = await query(sql, params);
        res.status(201).json({ id: result.rows[0].id, message: 'Meta diaria registrada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al registrar meta diaria (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar meta diaria.' });
    }
});

// Actualizar meta diaria
app.put('/metas-diarias/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, meta_venta_diaria } = req.body;
    if (!fecha || meta_venta_diaria === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar meta diaria.' });
    }
    const sql = `UPDATE metas_diarias SET fecha = $1, meta_venta_diaria = $2 WHERE id = $3`;
    const params = [fecha, meta_venta_diaria, id];

    try {
        await query(sql, params);
        res.json({ message: 'Meta diaria actualizada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al actualizar meta diaria (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar meta diaria.' });
    }
});

// Eliminar meta diaria
app.delete('/metas-diarias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM metas_diarias WHERE id = $1', [id]);
        res.json({ message: 'Meta diaria eliminada exitosamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar meta diaria (PG):', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar meta diaria.' });
    }
});
// Eliminar receta (principal)
app.delete('/recetas/:id', async (req, res) => {
    const recetaId = req.params.id; // Obtiene el ID de la URL

    // Valida que el ID sea un número
    if (isNaN(recetaId)) {
        return res.status(400).json({ error: 'ID de receta inválido.' });
    }

    let client; // Variable para el cliente de la transacción
    try {
        client = await pool.connect(); // Obtiene un cliente del pool
        await client.query('BEGIN'); // Inicia la transacción

        // Paso 1: Eliminar ingredientes asociados a la receta
        // Esto elimina las filas en ingredientes_receta que referencian esta receta
        await client.query('DELETE FROM ingredientes_receta WHERE receta_id = $1', [recetaId]);

        // Paso 2: Eliminar la receta de la tabla 'recetas_estandar'
        // CAMBIO CRÍTICO: La tabla es 'recetas_estandar', no 'recetas'
        const deleteRecetaResult = await client.query('DELETE FROM recetas_estandar WHERE id = $1', [recetaId]);

        if (deleteRecetaResult.rowCount === 0) {
            await client.query('ROLLBACK'); // Si no se encontró la receta, revierte
            return res.status(404).json({ error: 'Receta principal no encontrada para eliminar.' });
        }

        await client.query('COMMIT'); // Confirma la transacción si todo fue exitoso
        res.status(200).json({ message: 'Receta principal eliminada exitosamente.' });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK'); // Revierte la transacción si hubo un error
        }
        console.error('❌ Error al eliminar la receta principal (server.js):', error);
        res.status(500).json({ error: error.message || 'Error del servidor al eliminar la receta principal.' });
    } finally {
        if (client) {
            client.release(); // Libera el cliente de vuelta al pool
        }
    }
});
// LÍNEA DE INSERCIÓN SUGERIDA: Inserta el siguiente bloque COMPLETO JUSTO ANTES de la LÍNEA 1251.

// --- Rutas de Reportes y Resultados Diarios (Inicio del Bloque - INSERTA AQUÍ) ---
app.get('/resultados-del-dia', async (req, res) => {
const { fecha, fechaInicio, fechaFin } = req.query;    
let client;
    try {
        client = await pool.connect();
        const ventasResult = await client.query(
            `SELECT COALESCE(SUM(total_venta), 0) AS total_ventas
             FROM ventas
             WHERE fecha = $1;`,
            [fecha]
        );
        const totalVentas = parseFloat(ventasResult.rows[0].total_ventas);
        const pagosResult = await client.query(
            `SELECT COALESCE(SUM(monto), 0) AS total_pagos
             FROM pagos_diarios
             WHERE fecha = $1;`,
            [fecha]
        );
        const totalPagosOperativos = parseFloat(pagosResult.rows[0].total_pagos);
const gastosIngredientesResult = await client.query(
    `SELECT COALESCE(SUM(v.cantidad * r.costo_total_calculado), 0) AS gastos_ingredientes
     FROM ventas v
     JOIN recetas_estandar r ON v.platillo_id = r.id
     WHERE v.fecha = $1;`,
    [fecha]
);
const gastosIngredientes = parseFloat(gastosIngredientesResult.rows[0].gastos_ingredientes);
       const costoTotalOperativoDelDia = totalPagosOperativos + gastosIngredientes;
        const gananciaNeta = totalVentas - costoTotalOperativoDelDia;
        res.json({
            fecha,
            totalVentas,
            gastosIngredientes,
            totalPagosOperativos,
            costoTotalOperativoDelDia,
            gananciaNeta
        });
    } catch (error) {
        console.error('❌ Error al obtener resultados del día (server.js):', error);
        res.status(500).json({ error: error.message || 'Error del servidor al obtener resultados del día.' });
    } finally {
        if (client) {
            client.release();
        }
    }
});
// --- Rutas de Reportes y Resultados Diarios (Fin del Bloque) ---

// Este es un comentario de referencia. La línea app.listen debe estar después de este bloque.
// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend de Pa' Arriba! escuchando en el puerto ${port}`); // Mensaje actualizado
});
