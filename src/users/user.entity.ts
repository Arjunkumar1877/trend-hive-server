import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ type: 'varchar', nullable: true, unique: true }) // ✅ Optional and unique
  firebaseId?: string;

  @Column({ type: 'varchar', nullable: true, unique: true }) // ✅ Optional and unique
  phoneNumber?: string;
}
