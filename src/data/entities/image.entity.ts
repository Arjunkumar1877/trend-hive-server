// src/product/entities/image.entity.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    ManyToOne,
    JoinColumn 
  } from 'typeorm';
  import { Product } from './product.entity';
  
  @Entity()
  export class Image {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar' })
    image: string;
  
    @Column({ type: 'boolean', default: false })
    isCover: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @ManyToOne(() => Product, product => product.images)
    @JoinColumn()
    product: Product;
  }