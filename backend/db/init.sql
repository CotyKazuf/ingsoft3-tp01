CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  categoria TEXT NOT NULL,
  fecha DATE NOT NULL,
  medio_pago TEXT NOT NULL,
  tarjeta TEXT,
  tipo TEXT
);