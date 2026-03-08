import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { Address } from './entity/address.entity';
import { User } from '../users/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
