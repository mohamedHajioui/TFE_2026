import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entité générique clé/valeur pour stocker des réglages globaux
 * modifiables par l'admin sans redéploiement.
 *
 * Clés connues :
 *   - DELIVERY_ENABLED : 'true' | 'false'
 *   - DELIVERY_FEE     : nombre décimal en € (ex: '3.50')
 */
@Entity('setting')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export const SETTING_KEYS = {
  DELIVERY_ENABLED: 'DELIVERY_ENABLED',
  DELIVERY_FEE: 'DELIVERY_FEE',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
