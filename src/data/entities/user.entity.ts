import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Address } from './address.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'varchar',  unique: true })
  firebaseId?: string;

  @Column({ type: 'varchar', nullable: false }) 
  phoneNumber: string;
  

  @Column({ type: 'boolean', default: false })
  isEmailVerified?: string;


  @OneToMany(() => Address, (address) => address.user)
  addresses?: Address[];
}
