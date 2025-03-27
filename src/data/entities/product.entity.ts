// src/product/entities/product.entity.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    OneToMany,
    ManyToOne,
  } from 'typeorm';
import { Category } from './category.entity';
import { Image } from './image.entity';
  
  @Entity()
  export class Product {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar' })
    name: string;
  
    @Column({ type: 'int' })
    price: number;
  
    @Column({ type: 'varchar' })
    description: string;
  
    @ManyToOne(() => Category, category => category.products)
    category: Category;
  
    @Column({ type: 'int' })
    availableQuantity: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @OneToMany(() => Image, image => image.product)
    images: Image[];
  }