import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SETTING_KEYS, SettingKey } from './entity/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  /** Bootstrap des settings par défaut au démarrage. */
  async onModuleInit(): Promise<void> {
    await this.ensureDefault(
      SETTING_KEYS.DELIVERY_ENABLED,
      'true',
      'Active ou désactive la possibilité pour les clients de commander en livraison.',
    );
    await this.ensureDefault(
      SETTING_KEYS.DELIVERY_FEE,
      '3.50',
      'Frais de livraison fixes appliqués à toutes les commandes DELIVERY (en €).',
    );
  }

  private async ensureDefault(
    key: SettingKey,
    defaultValue: string,
    description: string,
  ): Promise<void> {
    const existing = await this.settingRepository.findOne({ where: { key } });
    if (!existing) {
      const setting = this.settingRepository.create({
        key,
        value: defaultValue,
        description,
      });
      await this.settingRepository.save(setting);
    }
  }

  async findAll(): Promise<Setting[]> {
    return await this.settingRepository.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: SettingKey | string): Promise<Setting> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting "${key}" introuvable`);
    }
    return setting;
  }

  /** Retourne true si la valeur est la string "true". */
  async getBool(key: SettingKey | string, fallback = false): Promise<boolean> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (!setting) return fallback;
    return setting.value === 'true';
  }

  /** Parse la valeur en nombre. Retourne `fallback` si absent ou invalide. */
  async getNumber(key: SettingKey | string, fallback = 0): Promise<number> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (!setting) return fallback;
    const parsed = Number(setting.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async update(key: string, dto: UpdateSettingDto): Promise<Setting> {
    let setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      setting = this.settingRepository.create({
        key,
        value: dto.value,
        description: dto.description ?? null,
      });
    } else {
      setting.value = dto.value;
      if (dto.description !== undefined) setting.description = dto.description;
    }

    return await this.settingRepository.save(setting);
  }

  /** Settings exposés publiquement (lisibles par le frontend client). */
  async findPublic(): Promise<Record<string, string>> {
    const publicKeys: SettingKey[] = [
      SETTING_KEYS.DELIVERY_ENABLED,
      SETTING_KEYS.DELIVERY_FEE,
    ];

    const settings = await this.settingRepository.find();
    const result: Record<string, string> = {};

    for (const s of settings) {
      if (publicKeys.includes(s.key as SettingKey)) {
        result[s.key] = s.value;
      }
    }

    return result;
  }
}
