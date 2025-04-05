import { pgTable, text, serial, numeric, timestamp, jsonb, integer, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base Rubayia CPF (Clientes)
export const baseRubayiaCpf = pgTable("base_rubayia_cpf", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  cliente_latitude: numeric("cliente_latitude"),
  cliente_longitude: numeric("cliente_longitude"),
  prestador_id: integer("prestador_id"),
  updated_at: timestamp("updated_at", { withTimezone: true }),
  distancia_prestador: numeric("distancia_prestador"),
  posicao_ranking: integer("posicao_ranking"),
  plano: jsonb("plano"),
  data_nascimento: date("data_nascimento"),
  idade: integer("idade"),
  estabelecimento: text("estabelecimento"),
  cnpj: text("cnpj"),
  nome: text("nome"),
  uf: text("uf"),
  nome_prestador: text("nome_prestador"),
  cep: varchar("cep"),
  sexo: text("sexo")
});

// Rede Bronze Amil Resumida (Prestadores)
export const redeBronzeAmilResumida = pgTable("rede_bronze_amil_resumida", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  prestador_latitude: numeric("prestador_latitude"),
  prestador_longitude: numeric("prestador_longitude"),
  uf: text("uf"),
  municipio: text("municipio"),
  cep: text("cep"),
  especialidades: text("especialidades").array(),
  planos: text("planos").array(),
  tipo_servico: text("tipo_servico"),
  nome_prestador: text("nome_prestador")
});

// Análise Distância PS (Resultados)
export const analiseDistanciaPs = pgTable("analise_distancia_ps", {
  id: serial("id").primaryKey(),
  cliente_id: integer("cliente_id"),
  prestador_id: integer("prestador_id"),
  distancia_km: numeric("distancia_km"),
  posicao_ranking: integer("posicao_ranking"),
  data_analise: timestamp("data_analise", { withTimezone: true }).defaultNow(),
  cliente_latitude: numeric("cliente_latitude"),
  cliente_longitude: numeric("cliente_longitude"),
  prestador_latitude: numeric("prestador_latitude"),
  prestador_longitude: numeric("prestador_longitude"),
  cliente_nome: varchar("cliente_nome"),
  cliente_cep: varchar("cliente_cep"),
  cliente_uf: varchar("cliente_uf"),
  prestador_nome: varchar("prestador_nome"),
  prestador_cep: varchar("prestador_cep"),
  prestador_uf: varchar("prestador_uf"),
  planos: text("planos"),
  especialidade: text("especialidade")
});

// Insert schemas
export const insertBaseRubayiaCpfSchema = createInsertSchema(baseRubayiaCpf).omit({ 
  id: true, 
  created_at: true 
});

export const insertRedeBronzeAmilResumidaSchema = createInsertSchema(redeBronzeAmilResumida).omit({ 
  id: true, 
  created_at: true 
});

export const insertAnaliseDistanciaPsSchema = createInsertSchema(analiseDistanciaPs).omit({ 
  id: true,
  data_analise: true  
});

// Types
export type Cliente = typeof baseRubayiaCpf.$inferSelect;
export type InsertCliente = z.infer<typeof insertBaseRubayiaCpfSchema>;

export type Prestador = typeof redeBronzeAmilResumida.$inferSelect;
export type InsertPrestador = z.infer<typeof insertRedeBronzeAmilResumidaSchema>;

export type AnaliseDistancia = typeof analiseDistanciaPs.$inferSelect;
export type InsertAnaliseDistancia = z.infer<typeof insertAnaliseDistanciaPsSchema>;

// Schemas for frontend validation
export const clienteSchema = z.object({
  id: z.number(),
  nome: z.string(),
  uf: z.string(),
  cep: z.string().optional(),
  cliente_latitude: z.number().optional(),
  cliente_longitude: z.number().optional()
});

export const prestadorSchema = z.object({
  id: z.number(),
  nome_prestador: z.string(),
  uf: z.string(),
  municipio: z.string(),
  cep: z.string().optional(),
  prestador_latitude: z.number().optional(),
  prestador_longitude: z.number().optional(),
  tipo_servico: z.string().optional(),
  especialidades: z.array(z.string()).optional(),
  planos: z.array(z.string()).optional()
});

export const analiseDistanciaSchema = z.object({
  id: z.number(),
  cliente_id: z.number(),
  prestador_id: z.number(),
  distancia_km: z.number(),
  posicao_ranking: z.number(),
  cliente_nome: z.string().optional(),
  prestador_nome: z.string().optional(),
  cliente_uf: z.string().optional(),
  prestador_uf: z.string().optional()
});

// User authentication (keeping the existing user schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
